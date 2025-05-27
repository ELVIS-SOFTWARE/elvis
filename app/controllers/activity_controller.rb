# frozen_string_literal: true
#
require "time"

class ActivityController < ApplicationController
  rescue_from ActiveRecord::RecordInvalid, with: :rescue_from_invalid

  def index
    @current_user = current_user
    @activity_refs = ActivityRef.all.includes({ activities: [], activity_ref_kind: {} })
    @seasons = Season.all_seasons_cached
    @rooms = Room.all
    @teachers = User.teachers.all
    @evaluation_level_refs = EvaluationLevelRef.all
    @locations = Location.all

    authorize! :manage, @rooms, @seasons, @activity_refs, @evaluation_level_refs
  end

  def list
    query = get_query_from_params

    authorize! :manager, query

    respond_to do |format|
      format.json { render json: activities_list_json(query) }
      format.csv { render plain: activities_list_csv(query), content_type: "text/csv" }
    end
  end

  def update
    activity = Activity.find(params[:activity][:id])

    authorize! :edit, activity

    Activity.transaction do
      activity.update!(activity_update_params)
      activity.activity_instances.each { |instance| instance.update(activity_instance_update_params) }
    end

    @activity_ref = activity.as_json include: {
      options: {
        include: {
          desired_activity: {
            include: {
              activity_application: {
                include: :user
              }
            }
          }
        }
      },
      activity_ref: {},
      users: {
        include: {
          levels: {
            include: %i[evaluation_level_ref activity_ref]
          },
          activity_refs: {},
          teachers_activity_refs: {},
          activity_application: {
            include: {
              desired_activities: {}
            }
          }
        }
      },
      room: {},
      teacher: {},
      teachers_activities: {
        include: {
          teacher: {}
        }
      }
    }

    render json: @activity_ref
  end

  # def generate_instances
  #   activity = Activity.first
  #   activity.create_instances_mock
  # end

  # {
  #   "activity": {
  #       "seasonId": 4,
  #       "teacherId": 2,
  #       "activityRefId": 7,
  #       "roomId": 3,
  #       "dayOfWeek": 2,
  #       "startTime": "2021-09-03T09:00:00",
  #       "endTime": "2021-09-03T10:00:00"
  #   },
  #   "recurrence": 1,
  #   "fromDate": "2021-09-01T00:00:00",
  #   "toDate": "2022-07-01T00:00:00"
  # }

  def create
    start_time = params[:activity][:startTime]
    end_time = params[:activity][:endTime]
    teacher_id = params[:activity][:teacherId].to_i
    from_date = params[:fromDate]
    to_date = params[:toDate]
    intervals = []

    authorize! :create, Activity.new(
      time_interval: interval,
      activity_ref: activity_ref,
      room: room,
      location: location,
      instruments: activity_ref.instruments,
      )

    # on cherche le jour du 1er cours de la saison 
    # on convertit d'abord le 1er jour de la saison (s.start, objet Time) en objet Date
    # start_date = Date.parse(season.start.to_s)

    # on récupère le numéro du jour dans la semaine
    # if start_date.cwday <= weekday
    #     first_day = start_date + (weekday - start_date.cwday) 
    # else
    #     first_day = start_date + 7+(weekday - start_date.cwday) 
    # end

    # on détermine maintenant le début et la fin de la 1ère séance de cours de la saison
    # istart = Time.parse(first_day.to_s + "T" + start_time)
    # iend = Time.parse(first_day.to_s + "T" + end_time)

    # On va maintenant créer l'Activity et les ActivityInstances au sein d'une transaction
    Activity.transaction do

      # on peut maintenant créer un intervalle pour notre future activité
      interval = TimeInterval.create!(
        activity: nil,
        is_validated: true,
        kind: "c",
        start: start_time,
        end: end_time
      )

      # on sécurise le from et le to
      from_date, to_date = interval.check_and_adjust_range(from_date, to_date).values

      activity_ref = ActivityRef.find(params[:activity][:activityRefId])
      room = Room.find(params[:activity][:roomId])
      location = room.location

      activity = Activity.create!(
        time_interval: interval,
        activity_ref: activity_ref,
        room: room,
        location: location,
        instruments: activity_ref.instruments, # instantiates ref's template positions
      )
      activity.add_teacher(teacher_id, true)

      interval.activity = activity
      interval.save!

      # NOTE Pourquoi fait-on un reload ici ?
      # Il y avait un problème de synchro de données avec la base
      activity.teachers_activities.reload

      # Création des instances de l'activité et des TimeIntervals correspondants
      intervals = activity.create_instances([], from_date, to_date)

      u = User.find(teacher_id)
      s = Season.from_interval(interval).first

      agn = Activities::AssignGroupsNames.new(u, s)
      agn.execute
      # Activities::AssignGroupsNames
      # .new(User.find(teacher_id), Season.from_interval(interval).first)
      # .execute
    end

    render :json => intervals, each_serializer: TimeIntervalSerializer
  end

  def add_student
    activity_id = params[:id]
    desired_activity_id = params[:desired_activity_id]

    desired_activity = DesiredActivity.includes({ activity_application: { user: [:adhesions] },
                                                  user: {} }).find(desired_activity_id)

    authorize! :edit, desired_activity&.activity_application

    activity = Activity.includes(:activity_ref).find(activity_id)


    error = nil
    user = desired_activity.activity_application.user

    # Lock database so that students limit is respected for every
    # concurrent request
    activity.with_lock("FOR UPDATE") do
      begin_at = desired_activity.activity_application.begin_at

      # calculate students count according to user's begin date
      # (do not include students who are yet to start
      #  or who have already stopped)
      students_count = activity
                         .closest_instance(begin_at)
                         .active_students
                         .count

      if students_count >= activity.activity_ref.occupation_hard_limit
        # the activity is already full, send error and up to date
        # activity along with its new students to prove user
        # they tried, but still no.
        error = "Le cours est maintenant plein"
        break
      end

      DesiredActivity.find(desired_activity_id).options.map(&:activity).compact.each do |a|
        a.remove_student(desired_activity_id, true)
      end

      Activities::AddStudent
        .new(activity_id, desired_activity_id)
        .execute

      # Ici, on calcule le nombre de séances dues par l'utilisateur (parce qu'il n'a pas commencé en début de saison)
      # Le nombre de séances "manquées" est déduit du nombre de séances dues (calcul du prorata)
      desired_activity.update(
        prorata: activity.calculate_prorata_for_student(user.id)
      )

      # creating the adhesion for user if non-existing
      season = desired_activity.activity_application.season
      if user.adhesions.where(season_id: season.id).none?
        validity_start_date = if Time.now.month == 6
                                Time.new(Time.now.year, 7, 5, 0, 0, 0) # 5 JUILLET
                              else
                                Time.now
                              end
        user.adherent_number = User.maximum("adherent_number") + 1 if user.adherent_number.nil?
        Adhesion.create(
          validity_start_date: validity_start_date,
          validity_end_date: validity_start_date + 1.year,
          season_id: season.id,
          is_active: true,
          user_id: user.id
        )
      end

      # creating the adhesion for accompanient for "Eveil" if non-existing
      if activity.activity_ref.kind == "Eveil Musical"
        accompanient = User.includes(:adhesions).find(desired_activity.user.id)
        if accompanient.adhesions.length.zero? || (user.adhesions.length.positive? && !user.adhesions.last.is_active)
          validity_start_date = if Time.now.month == 6
                                  Time.new(Time.now.year, 7, 5, 0, 0, 0) # 5 JUILLET
                                else
                                  Time.now
                                end
          accompanient.adherent_number = User.maximum("adherent_number") + 1 if accompanient.adherent_number.nil?
          Adhesion.create(
            validity_start_date: validity_start_date,
            validity_end_date: validity_start_date + 1.year,
            is_active: true,
            user: accompanient
          )
        end
      end

      # maj des preinscriptions

      if season.next
        pre_application = user.pre_applications.includes(:pre_application_activities).where(season: season.next).first # ne peut en avoir qu'une par saison

        if pre_application.present?
          pre_application.pre_application_activities.each do |pre_application_activity|
            if pre_application_activity.activity.activity_ref_id == activity.activity_ref_id # on ne met a jour que les preinscriptions de la meme activite
              pre_application_activity.update(activity_id: activity.id)
            end
          end
        end
      end

    end

    activity.reload

    render json: {
      error: error,
      activity: Utils.format_for_suggestion(user, activity, desired_activity.activity_application.begin_at)
    }
  end

  def remove_student
    activity_id = params[:id]
    desired_activity_id = params[:desired_activity_id]

    desired_activity = DesiredActivity.find(desired_activity_id)

    authorize! :edit, desired_activity&.activity_application

    activity = Activity.find(activity_id)

    activity.remove_student(desired_activity_id)

    render json: Utils.format_for_suggestion(
      desired_activity.activity_application.user,
      activity,
      desired_activity.activity_application.begin_at
    )
  end

  def add_student_option
    activity_id = params[:id]
    desired_activity_id = params[:desired_activity_id]

    desired_activity = DesiredActivity.includes(:activity_application, :options).find(desired_activity_id)

    authorize! :edit, desired_activity&.activity_application

    activity = Activity.includes(activity_instances: :time_interval).find(activity_id)

    Activities::AddStudent
      .new(activity_id, desired_activity_id, true)
      .execute


    # Créating adhesion if non-existing
    user = desired_activity.activity_application.user
    season_id = desired_activity.activity_application.season_id
    if user.adhesions.where(season_id: season_id).none?
      validity_start_date = if Time.now.month == 6
                              Time.new(Time.now.year, 7, 5, 0, 0, 0) # 5 JUILLET
                            else
                              Time.now
                            end
      user.adherent_number = User.maximum("adherent_number") + 1 if user.adherent_number.nil?
      Adhesion.create(
        validity_start_date: validity_start_date,
        validity_end_date: validity_start_date + 1.year,
        season_id: season_id,
        is_active: true,
        user: user
      )
    end

    render json: desired_activity, include: {
      options: {
        include: {
          desired_activity: {
            only: [],
            include: {
              activity_application: {
                include: :user
              }
            }
          }
        }
      }
    }
  end

  def remove_student_option
    activity_id = params[:id]
    desired_activity_id = params[:desired_activity_id]

    desired_activity = DesiredActivity.includes(:options).find(desired_activity_id)

    authorize! :edit, desired_activity&.activity_application

    activity = Activity.includes(activity_instances: :time_interval).find(activity_id)
    activity.remove_student(desired_activity_id, true)

    render json: desired_activity, include: {
      options: {
        include: {
          desired_activity: {
            only: [],
            include: {
              activity_application: {
                only: :user_id
              }
            }
          }
        }
      }
    }
  end

  def update_instances
    @activity_ref = Activity.includes({ activity_instances: :time_interval }).find(params[:id])

    authorize! :edit, @activity_ref

    date_format = "%F"

    instances_to_create = params[:activityInstances].map do |i|
      {
        start: DateTime.parse(i[:start]),
        end: DateTime.parse(i[:end])
      }
    end

    existing_instances = @activity_ref
                           .activity_instances
                           .select(&:time_interval) # remove instances without time_intervals
                           .each_with_object({}) do |ai, h|
      h[ai.time_interval.start.strftime(date_format)] = ai
    end

    new_instances = instances_to_create.reject { |i| existing_instances.include? i[:start].strftime(date_format) }

    intervals = @activity_ref.create_instances(new_instances)

    intervals.map(&:activity_instance).each do |ins|
      @activity_ref.users.each do |u|
        StudentAttendance.create!(user: u, activity_instance: ins)
      end
    end

    result = TimeInterval.includes({
                                     activity_instance: {
                                       student_attendances: {},
                                       activity: {
                                         activity_ref: {},
                                         users: {
                                           levels: %i[evaluation_level_ref activity_ref]
                                         },
                                         room: {},
                                         teachers_activities: {}
                                       },
                                       room: {}
                                     }
                                   }).where(id: @activity_ref.activity_instances.map(&:time_interval).compact)

    render json: result.as_json({
                                  include: {
                                    activity_instance: {
                                      include: {
                                        student_attendances: {},
                                        activity: {
                                          include: {
                                            activity_ref: {},
                                            users: {
                                              include: {
                                                levels: {
                                                  include: %i[activity_ref evaluation_level_ref]
                                                }
                                              }
                                            },
                                            room: {},
                                            teacher: {}
                                          }
                                        },
                                        room: {}
                                      }
                                    }
                                  }
                                })
  end

  def change_teacher
    @activity_ref = Activity.find(params[:id])

    authorize! :edit, @activity_ref

    Activity.transaction do
      teachers_activity = @activity_ref.teachers_activities.where(user_id: params[:teacher_id]).first
      was_main = teachers_activity ? teachers_activity.is_main : false
      @activity_ref.remove_teacher(teachers_activity.user_id)
      @activity_ref.add_teacher(params[:teacher][:user_id], was_main)
    end
  end

  def change_is_main
    @activity_ref = Activity.find(params[:id])

    authorize! :edit, @activity_ref

    Activity.transaction do
      teachers_activity = @activity_ref.teachers_activities.where(user_id: params[:teacher_id]).first
      teachers_activity.update(is_main: params[:teacher][:is_main])
      @teachers_activity = teachers_activity.as_json
      render json: @teachers_activity
    end
  end

  def add_teacher
    @activity_ref = Activity.find(params[:id])

    authorize! :edit, @activity_ref

    Activity.transaction do
      new_teacher = @activity_ref.add_teacher(params[:teacher_id], false)
      @new_teacher = new_teacher.as_json
      render json: @new_teacher
    end
  end

  def remove_teacher
    @activity_ref = Activity.find(params[:id])

    authorize! :edit, @activity_ref

    Activity.transaction do
      @activity_ref.remove_teacher(params[:teacher_id])
    end
  end

  def delete
    # @type [Activity]
    activity = Activity.includes(:time_interval).find(params[:id])

    authorize! :destroy, activity

    time_interval = activity.time_interval

    if time_interval.nil?
      time_interval = activity.activity_instances.joins(:time_interval).order("time_intervals.start").first&.time_interval
    end

    teacher = activity.teacher
    season = time_interval.nil? ? nil : Season.from_interval(time_interval).first

    Activities::DestroyActivitiesAndTimeIntervals
      .new(activity)
      .execute

    unless season.nil?
      Activities::AssignGroupsNames
        .new(teacher, season)
        .execute
    end

    render json: time_interval
  end

  def get_availabilities
    ref_ids = params[:activity_ref_ids]
    activities = []
    ref_ids.each do |id|
      activities << Activity.where(activity_ref_id: id)
    end

    next_season = Season.next

    render json: activities.flatten
                           .select { |a| a.activity_ref.kind == "Enfance" }
                           .select { |a| a.time_interval.start.between?(next_season.start, next_season.end) }
                           .as_json(include: [:time_interval])
  end

  def users_list
    activity = Activity.find(params[:id])

    authorize! :read, activity

    users = (activity.students + activity.options).map(&:user).compact.uniq

    respond_to do |format|
      format.csv { render plain: users_list_csv(users), content_type: "text/csv" }
    end
  end

  def add_course
    @current_user = current_user
    @url_base = ApplicationUrl.main_root_url || ENV["DOMAIN"] || "http://localhost:5000"
  end

  def activity_time_intervals
    a_params = params.permit(
      :activity_id,
    )

    activityId = a_params[:activity_id]
    time_intervals = []

    unless activityId.nil?
      time_intervals = ActivityInstance.where(activity_id: activityId).select(:id, :time_interval_id).as_json({ include: { student_attendances: {} } })
      time_intervals = time_intervals.map { |ti| { activity_instance_id: ti['id'], time_interval: TimeInterval.find(ti['time_interval_id']), student_count: ti["student_attendances"].count } }
    end

    respond_to do |format|

      format.json do
        render json: time_intervals
      end
    end

  end

  private

  def users_list_csv(users)
    CSV.generate nil, col_sep: ";" do |csv|
      csv << [
        "N° adhérent de l'élève",
        "Nom de l'élève",
        "Prénom de l'élève",
        "Sexe de l'élève",
        "Âge de l'élève",
        "Adresse mail de l'élève",
        "Adresse postale de l'élève",
        "N° de téléphone de l'élève",
        "Prénom du responsable légal",
        "Nom du responsable légal",
        "N° de téléphone du responsable légal"
      ]

      users.each do |user|
        telephone = (user.telephones.select { |t| t.label == "portable" }.first || user.telephones.first)
        user_telephone_number = telephone&.number || "?"

        address = user.addresses.first
        address = address && "#{address.street_address} #{address.postcode} #{address.city&.upcase}" || "?"

        legal_referent = user.family_links.select(&:is_legal_referent).first
        legal_referent &&= (legal_referent.user == user ? legal_referent.member : legal_referent.user)

        legal_referent_telephone = legal_referent && (legal_referent.telephones.select do |t|
          t.label == "portable"
        end.first || legal_referent.telephones.first)
        legal_referent_telephone_number = legal_referent_telephone&.number || "?"

        csv << [
          user.adherent_number,
          user.last_name,
          user.first_name,
          user.sex,
          user.birthday && user.age,
          user.email,
          address,
          user_telephone_number,
          legal_referent&.first_name || "?",
          legal_referent&.last_name || "?",
          legal_referent_telephone_number
        ]
      end
    end
  end

  def activity_update_params
    params
      .require(:activity)
      .permit(
        :room_id,
        :group_name,
        :location_id,
        :activity_ref_id,
        :time_interval_id,
        :evaluation_level_ref_id,
        :next_season_evaluation_level_ref_id
      )
  end

  def activity_instance_update_params
    params
      .require(:activity)
      .permit(:room_id, :location_id)
  end

  def change_teacher_params
    params
      .require(:teacher)
      .permit(:user_id, :is_main)
  end

  def validate_desired_activities(ids)
    ids.each do |id|
      desired_activity = DesiredActivity.find(id)
      desired_activity.is_validated = true
      desired_activity.save!
    end
  end

  def invalidate_desired_activities(ids)
    ids.each do |id|
      desired_activity = DesiredActivity.find(id)
      desired_activity.is_validated = false
      desired_activity.save
    end
  end

  def rescue_from_invalid(exception)
    render json: { errors: exception.record.errors[:base] }, status: 400
  end

  def get_query_from_params(json_query = params)
    @current_user = current_user
    filter_by_occupation = nil
    includes_h = {
      evaluation_level_ref: {},
      room: {},
      location: {},
      users: {
        activity_applications: :desired_activities,
        levels: {
          evaluation_level_ref: {},
          activity_ref: { activity_ref_kind: {} }
        },
        activity_refs: { activity_ref_kind: {} },
        teachers_activity_refs: {}
      },
      options: {
        desired_activity: {
          activity_application: :user
        }
      },
      teachers_activities: :teacher,
      time_interval: {},
      activity_ref: { activity_ref_kind: {} },
      student_evaluations: {}
    }

    query = Activity
              .all
              .includes(includes_h)

    query = query.joins(:time_interval).where(time_intervals: { is_validated: true })

    json_query[:filtered]&.each do |filter|
      prop = filter[:id]
      val = filter[:value]

      case prop
      when "activity_ref_id"
        query = query.where(activity_ref_id: val)
      when "teacher_id"
        query = query.joins(:teachers_activities).where(
          "teachers_activities.is_main = true AND teachers_activities.user_id = ?", val)
      when "time_interval"
        unless val[:start].blank?
          query = query.joins(:time_interval).where(
            "(time_intervals.start AT TIME ZONE 'GMT' AT TIME ZONE 'Europe/Paris')::time >= ?::time", val[:start])
        end
        unless val[:end].blank?
          query = query.joins(:time_interval).where(
            "(time_intervals.end AT TIME ZONE 'GMT' AT TIME ZONE 'Europe/Paris')::time <= ?::time", val[:end])
        end
      when "average_age"
        query = query.where("
                    (SELECT FLOOR(AVG(age)) FROM (
                            SELECT extract(year from age(birthday)) AS age
                            FROM users
                            WHERE users.id IN (
                                SELECT user_id
                                FROM students
                                WHERE students.activity_id = activities.id
                            )
                        )
                    agequery) = ?
                ", val)
      when "room"
        query = query.where("activities.room_id = ?", val)
      when "location"
        query = query.where("activities.location_id = ?", val)
      when "level"
        if val == "TBD"
          query = query.joins(:time_interval).where("
            (activities.evaluation_level_ref_id IS NULL) AND
            (
              (
                select count(distinct l.evaluation_level_ref_id)
                from students s
                join users u on u.id = s.user_id
                join levels l on l.user_id = u.id
                where s.activity_id = activities.id
                and l.season_id = (select s.id from seasons s where time_intervals.start between s.start and s.end limit 1)
                and l.activity_ref_id = activities.activity_ref_id
              ) > 1
              OR
              (
                select count(distinct l.evaluation_level_ref_id)
                from students s
                join users u on u.id = s.user_id
                join levels l on l.user_id = u.id
                where s.activity_id = activities.id
                and l.season_id = (select s.id from seasons s where time_intervals.start between s.start and s.end limit 1)
                and l.activity_ref_id = activities.activity_ref_id
              ) = 0
            )")
        else
          query = query.joins(:time_interval, :activity_ref)
                       .where("
            (
              activities.evaluation_level_ref_id = ?
            ) OR (
              activities.evaluation_level_ref_id IS NULL AND
              (
                SELECT COUNT(*) = 1 FROM (
                  SELECT DISTINCT evaluation_level_ref_id FROM levels l WHERE l.user_id IN (
                    SELECT user_id FROM students
                    WHERE activity_id = activities.id
                  )
                  AND l.season_id = (
                    SELECT id FROM seasons
                    WHERE tsrange(seasons.start, seasons.end, '[]') @> time_intervals.start
                    LIMIT 1
                  )
                  AND l.activity_ref_id = activities.activity_ref_id
                ) as a
              ) AND
              (
                SELECT MIN(l.evaluation_level_ref_id) FROM levels l
                WHERE l.user_id IN (
                  SELECT user_id FROM students
                  WHERE activity_id = activities.id
                )
                AND l.season_id = (
                  SELECT id FROM seasons
                  WHERE tsrange(seasons.start, seasons.end, '[]') @> time_intervals.start
                  LIMIT 1
                )
                AND l.activity_ref_id = activities.activity_ref_id
              ) = ?
            )", val, val)
        end
      when "group_name"
        query = query.where("activities.group_name ILIKE (? || '%')", val)
      when "season_id"
        season = Season.find(val)

        unless season.nil?
          query = query.joins(:time_interval).where(
            "tstzrange(?, ?, '[]') @> tstzrange(LEAST(time_intervals.start, time_intervals.end), GREATEST(time_intervals.start, time_intervals.end), '[]')", season.start, season.end)
        end
      when "day"
        query = query.joins(:time_interval).where("extract(DOW FROM time_intervals.start) = ?::numeric", val)
      when "occupation"
        filter_by_occupation = val
      end
    end

    # Filter by occupation
    if filter_by_occupation
      reference_date_filter = json_query[:filtered].find { |f| f[:id] === "reference_date" }
      reference_date = reference_date_filter && Date.parse(reference_date_filter[:value]) || Date.today

      case filter_by_occupation
      when "FULL"
        query = query.select do |act|
          if act.activity_ref.is_work_group
            act.count_active_instruments >= act.activities_instruments.count
          else
            act.count_active_students(reference_date) >= act.activity_ref.occupation_limit
          end
        end
      when "NOR_EMPTY_NOR_FULL"
        query = query.select do |act|
          if act.activity_ref.is_work_group
            act.count_active_instruments > 0 && act.count_active_instruments < act.activities_instruments.count
          else
            active_count = act.count_active_students(reference_date)
            active_count.positive? && active_count < act.activity_ref.occupation_limit
          end
        end
      when "EMPTY"
        query = query.select do |act|
          if act.activity_ref.is_work_group
            act.count_active_instruments.zero?
          else
            act.count_active_students(reference_date).zero?
          end
        end
      when "NOT_FULL"
        query = query.select do |act|
          if act.activity_ref.is_work_group
            act.count_active_instruments < act.activities_instruments.count
          else
            act.count_active_students(reference_date) < act.activity_ref.occupation_limit
          end
        end
    end

      query = Activity.includes(includes_h).where(id: query.map(&:id))
    end

    if json_query[:sorted]
      direction = json_query[:sorted][:desc] ? "desc" : "asc"
      prop = json_query[:sorted][:id]

      case prop
      when "activity_ref_id"
        query = query.joins(:activity_ref).order("activity_refs.label #{direction}")
      when "teacher_id"
        query = query
                  .joins(:teachers_activities)
                  .joins("INNER JOIN users AS teacher ON teachers_activities.user_id = teacher.id")
                  .order("teacher.last_name #{direction}")
      when "average_age"
        query = query.order(Arel.sql("
                    (SELECT FLOOR(AVG(age)) FROM (
                            SELECT extract(year from age(birthday)) AS age
                            FROM users
                            WHERE users.id IN (
                                SELECT user_id
                                FROM students
                                WHERE students.activity_id = activities.id
                            )
                        ) age_set) " + direction))
      when "room"
        query = query.joins(:room).order("rooms.label #{direction}")
      when "location"
        query = query.joins(:location).order("locations.label #{direction}")
      when "level"
        query = query.joins(:time_interval).order(Arel.sql("
                (SELECT MIN(l.evaluation_level_ref_id) FROM levels l
                 WHERE l.user_id IN (
                    SELECT user_id FROM students
                    WHERE activity_id = activities.id
                 )
                 AND l.activity_ref_id = activities.activity_ref_id
                 AND l.season_id = (
                     SELECT id FROM seasons
                     WHERE tsrange(seasons.start, seasons.end, '[]') @> time_intervals.start
                 ))  " + direction))
      when "day"
        query = query
                  .joins(:time_interval)
                  .order!(Arel.sql("(extract(DOW FROM time_intervals.start) + 6)::integer % 7 #{direction}"))
      when "occupation"
        query = query.joins(:activity_ref).order(Arel.sql("(SELECT COUNT(*) FROM students WHERE students.activity_id = activities.id)::float / activity_refs.occupation_limit::float #{direction}"))
      when "season_id"
        query = query.joins(:time_interval).joins(Arel.sql("LEFT OUTER JOIN seasons ON tstzrange(seasons.start, seasons.end, '[]') @> tstzrange(LEAST(time_intervals.start, time_intervals.end), GREATEST(time_intervals.start, time_intervals.end))")).order("seasons.id #{direction}")
      when "group_name"
        query = query.order("activities.group_name #{direction}")
      end

      query = query.order("activities.id ASC")
    end

    query
  end

  def activities_list_json(query, filter = params)
    total = query.count

    if filter[:page] && filter[:page_size]
      query = query
                .page(filter[:page] + 1)
                .per(filter[:page_size])

      total_pages = query.total_pages
    end

    # Map users applications by activity
    apps_dates = {}
    query.each do |act|
      apps_dates[act.id] = {}

      act.users.each do |u|
        # find application which matches this activity
        apps_dates[act.id][u.id] = u.activity_applications
                                    .reject { |app| app.desired_activities.find { |da| da.activity_id == act.id }.nil? }
                                    .first
      end
    end

    @result = query.as_json include: {
      room: {},
      location: {},
      activities_instruments: {
        include: :instrument
      },
      student_evaluations: {},
      evaluation_level_ref: {},
      users: {
        include: {
          levels: {
            include: {
              evaluation_level_ref: {},
              activity_ref: { include: [:activity_ref_kind] }
            }
          }
        }
      },
      options: {
        include: {
          user: {
            include: {
              levels: {
                include: {
                  evaluation_level_ref: {},
                  activity_ref: { include: [:activity_ref_kind] }
                }
              }
            }
          },
          desired_activity: {
            include: :activity_application
          }
        }
      },
      teacher: {
        include: {
          planning: {
            only: :id
          }
        }
      },
      time_interval: {},
      activity_ref: { include: [:activity_ref_kind] }
    }

    @result.each do |act|
      act["users"].each do |u|
        app = apps_dates[act["id"]][u["id"]]

        if app.nil?
          u["begin_at"] = nil
          u["stopped_at"] = nil
        else
          u["begin_at"] = app.begin_at
          u["stopped_at"] = app.stopped_at
        end
      end

      if act["teacher"] == nil
        old_teacher_id = Activity.find(act["id"]).teachers_activities.where(is_main: true).first&.user_id
        act["teacher"] = User.find(old_teacher_id).as_json({
                                                             include: {
                                                               planning: {
                                                                 only: :id
                                                               }
                                                             }
                                                           }) if old_teacher_id
      end

      act["activity_instance"] =
        ActivityInstance
          .joins(:time_interval)
          .where(activity_id: act["id"])
          .where(time_intervals: { start: (DateTime.parse(filter[:filtered][0][:value]&.to_s) || DateTime.now).. })
          .order("time_intervals.start asc")
          .first
    end

    {
      data: @result,
      pages: total_pages,
      total: total
    }
  end

  def activities_list_csv(query)
    users = (query.map(&:students) + query.map(&:options)).flatten.map(&:user).compact.uniq
    users_list_csv(users)
  end

end
