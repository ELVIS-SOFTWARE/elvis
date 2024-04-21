class PlanningController < ApplicationController
  skip_before_action :verify_authenticity_token, only: [:update_availabilities]

  def index_for_teachers
    @current_user = current_user
    plannings = Planning.includes(:user).where(users: { is_teacher: true })
    authorize! :manage, plannings

    @plannings = plannings.as_json(include: [user: { include: :activity_refs }])
  end

  def index_for_rooms
    @current_user = current_user
    @rooms = Room.all.order(:label)
    authorize! :manage, @rooms
  end

  def show
    @current_user = current_user

    redirect_to planning_simple_path and return unless current_user.is_admin || current_user.is_teacher

    planning = Planning.includes(
      user: {
        levels: %i[evaluation_level_ref activity_ref],
        activity_refs: {}
      }
    ).find(params[:id])

    authorize! :read, planning

    @planning = PlanningSerializer.new(planning).as_json

    day = !params[:day].nil? ? Date.parse(params[:day]) : DateTime.now.to_date

    @day = day.beginning_of_week

    @season = Season.current.as_json({ include: [:holidays] })
    @next_season = Season.next.as_json({ include: [:holidays] })
    @seasons = Season.all.as_json({ include: [:holidays] })

    @new_student_level_questions = Question.new_student_level_questionnaire
    # trouver la date de validation de la saison courante pour éventuellement afficher une alerte au prof
    @validation_date = Season.current.date_for_teacher_planning_validation

    @rooms = Room.includes(:activity_refs).for_user_activities(planning.user).as_json(include: [:activity_refs])
    room_refs = Room.includes(:location).all
    @room_refs = ActiveModelSerializers::SerializableResource.new(room_refs, each_serializer: RoomSerializer)
    @teachers = User.teachers.order(:last_name, :first_name).includes(:teachers_activity_refs,
                                                                      :planning).as_json(include: %i[
                                                                                           teachers_activity_refs planning
                                                                                         ])
    @users_for_navigation = @teachers

    # ouid = origin user id
    @origin_user = params[:ouid].nil? ? nil : User.find_by(id: params[:ouid])

    if (@origin_user.present? && !@origin_user.is_teacher) || !planning.user.is_teacher
      @users_for_navigation = planning.user.whole_family(@season['id']).reject { |u| u == planning.user }.as_json(include: %i[planning])
    end

    @users_for_navigation.reject! { |user| user['planning'].nil? }

    @activity_refs = ActivityRef.all
    @evaluation_level_refs = EvaluationLevelRef.all
    @levels = EvaluationLevelRef.all
    @locations = Location.all.as_json
    @planning_owners = User.teachers.each_with_object({}) do |user, h|
      h[user.planning_id] = user.id
    end
    @show_availabilities = Parameter.get_value("planning.show_disponibilities") == true
    @teacher_can_edit = Parameter.get_value("planning.teacher_can_edit_planning") == true
  end

  def show_simple
    redirect_to root_path and return unless current_user.is_teacher
    redirect_to planning_path(current_user.planning.id) if Parameter.get_value("planning.teacher_can_edit_planning") == true

    @current_planning_id = User.find(current_user.id).planning.id
    @teachers = User.teachers.order(:last_name, :first_name).includes(:teachers_activity_refs,
                                                                      :planning).as_json(include: %i[
                                                                                           teachers_activity_refs planning
                                                                                          ])

    if params['id'].nil? || params['id'].to_i === current_user.planning.id
      planning = Plannings::GetSimplePlanning.new(current_user, params[:day]).execute
      @name = { "last_name" => current_user.last_name, "first_name" => current_user.first_name }

    else
      teacher_selected = @teachers.select { |t| t['planning']['id'] == params['id'].to_i }
      @selected_planning_id = teacher_selected[0]['planning']['id']
      planning = Plannings::GetSimplePlanning.new(User.find(teacher_selected[0]['id']), params[:day]).execute
      @name = { "last_name" => teacher_selected[0]["last_name"], "first_name" => teacher_selected[0]["first_name"] }

    end

    @day = planning[:day]
    @data = planning[:data]
    @current_user = current_user
    @seasons = Season.all
    @locations = Location.all
  end

  def get_intervals_simple

    render json: {}, status: 403 and return unless current_user.is_teacher

    if params['id'].nil? || params['id'].to_i === current_user.planning.id
      render json: Plannings::GetSimplePlanning.new(current_user, params[:day]).execute
    else
      render json: Plannings::GetSimplePlanning.new(User.find(Planning.find(params['id']).user_id), params[:day]).execute
    end
  end

  def show_generic
    @current_user = current_user
    planning = Planning.includes({
                                   user: {
                                     levels: %i[evaluation_level_ref activity_ref],
                                     activity_refs: {},
                                     teachers_activities: {
                                       activity: {
                                         time_interval: :activity
                                       }
                                     }
                                   }
                                 })
                       .find(params[:id])

    authorize! :read, planning

    @planning = PlanningSerializer.new(planning).as_json include: "user.*"

    season = Season.next

    season_bounds = (season.start..season.end)

    time_intervals = planning
                       .user
                       .teachers_activities
                       .map(&:activity)
                       .compact
                       .map(&:time_interval)
                       .compact
                       .uniq
                       .select { |ti| season_bounds.include? ti.start }

    time_intervals += planning.time_intervals.where(is_validated: false, start: season_bounds).uniq

    @time_intervals = time_intervals.as_json include: {
      activity: {
        include: {
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
              teachers_activity_refs: {}
            }
          },
          room: {}
        }
      }
    }

    day = Season.next.start
    @day = day.beginning_of_week

    @season = season.as_json({ include: [:holidays] })
    @seasons = Season.all.as_json({ include: [:holidays] })

    # trouver la date de validation de la saison courante pour éventuellement afficher une alerte au prof
    @validation_date = Season.current.date_for_teacher_planning_validation

    @rooms = Room.includes(:activity_refs).for_user_activities(planning.user).as_json(include: [:activity_refs])
    room_refs = Room.includes(:location).all
    @room_refs = ActiveModelSerializers::SerializableResource.new(room_refs, each_serializer: RoomSerializer)
    @teachers = User.teachers.order(:last_name, :first_name).includes(:teachers_activity_refs,
                                                                      :planning).as_json(include: %i[
                                                                                           teachers_activity_refs planning
                                                                                         ])
    @levels = EvaluationLevelRef.all
    @locations = Location.all.as_json
  end

  def get_intervals
    intervals = Planning
                  .find(params[:id])
                  .time_intervals
                  .includes({
                              comment: {},
                              activity_instance: {
                                student_attendances: {},
                                activity: {
                                  activity_ref: {},
                                  students: {},
                                  users: {
                                    levels: %i[evaluation_level_ref activity_ref]
                                  },
                                  options: {
                                    desired_activity: {
                                      activity_application: { user: {} }
                                    }
                                  },
                                  room: {},
                                  location: {},
                                  teachers_activities: {}
                                },
                                room: {},
                                cover_teacher: {}
                              },
                              evaluation_appointment: {
                                student: {},
                                teacher: {},
                                activity_ref: {}
                              }
                            })
                  .joins("LEFT OUTER JOIN activity_instances ON activity_instances.time_interval_id = time_intervals.id")
                  .where("NOT time_intervals.is_validated OR time_intervals.kind = 'e' OR activity_instances.id IS NOT NULL") # If the interval is validated it must have an activity_instance
                  .where("date_trunc(:granularity, time_intervals.start AT TIME ZONE 'Europe/Paris') = date_trunc(:granularity, :date::date AT TIME ZONE 'Europe/Paris')", {
                    granularity: params[:granularity],
                    date: params[:date]
                  })

    intervals = intervals.uniq

    holidays = Holiday.where("date_trunc(:granularity, date AT TIME ZONE 'Europe/Paris') = date_trunc(:granularity, :target_date::date AT TIME ZONE 'Europe/Paris')", {
      granularity: params[:granularity],
      target_date: params[:date]
    })

    @intervals = intervals.as_json({
                                     include: {
                                       comment: {},
                                       activity_instance: {
                                         include: {
                                           student_attendances: {},
                                           activity: {
                                             include: {
                                               activity_ref: {},
                                               students: {},
                                               options: {
                                                 include: {
                                                   desired_activity: {
                                                     include: {
                                                       activity_application: {
                                                         include: {
                                                           user: {}
                                                         }
                                                       }
                                                     }
                                                   }
                                                 }
                                               },
                                               users: {
                                                 include: {
                                                   levels: {
                                                     include: %i[activity_ref evaluation_level_ref]
                                                   }
                                                 }
                                               },
                                               room: {},
                                               location: {},
                                               teacher: {}
                                             }
                                           },
                                           room: {},
                                           cover_teacher: {}
                                         },
                                         methods: :inactive_students
                                       },
                                       evaluation_appointment: {
                                         include: {
                                           student: {},
                                           teacher: {},
                                           activity_ref: {}
                                         }
                                       }
                                     }
                                   })

    render json: { intervals: @intervals, holidays: holidays }
  end

  def get_room_intervals
    @room = Room.find(params[:id])

    #  TODO the include is all kind of weird => refactor
    activity_instances = ActivityInstance.includes(
      time_interval: {
        activity_instance: {
          activity: {
            activity_ref: {},
            users: {
              levels: %i[evaluation_level_ref activity_ref]
            },
            room: {},
            teachers_activities: {}
          }
        }
      }
    )
                                         .joins(:time_interval)
                                         .where(room: @room)
                                         .where("date_trunc(:granularity, time_intervals.start AT TIME ZONE 'Europe/Paris') = date_trunc(:granularity, :date::date AT TIME ZONE 'Europe/Paris')", {
                                           granularity: params[:granularity],
                                           date: params[:date]
                                         })

    intervals = activity_instances.map(&:time_interval).compact

    holidays = Holiday.where("date_trunc(:granularity, date AT TIME ZONE 'Europe/Paris') = date_trunc(:granularity, :target_date::date AT TIME ZONE 'Europe/Paris')", {
      granularity: params[:granularity],
      target_date: params[:date]
    })

    @intervals = intervals.as_json include: {
      activity_instance: {
        include: {
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
          }
        }
      }
    }

    render json: { intervals: @intervals, holidays: holidays }
  end

  def show_for_conflict
    @current_user = current_user
    conflict = Conflict.find(params[:conflict_id])
    # time_interval = conflict.activity_instance.time_interval
    room_time_intervals = TimeInterval.in_room(conflict.activity_instance.room.id)

    plannings = Planning.includes({
                                    time_intervals: {
                                      activity_instance: {
                                        activity: {
                                          options: {
                                            desired_activity: {
                                              activity_application: [:user]
                                            }
                                          },
                                          activity_ref: {},
                                          users: {
                                            levels: %i[evaluation_level_ref activity_ref],
                                            activity_refs: {},
                                            teachers_activity_refs: {}
                                          },
                                          room: {}
                                        }
                                      }
                                    }
                                  },
                                  user: {
                                    levels: %i[evaluation_level_ref activity_ref],
                                    activity_refs: {}
                                  }).find(conflict.plannings.pluck(:id))

    week_start = conflict.ts.at_beginning_of_week
    week_end = conflict.ts.at_end_of_week

    intervals = plannings.map(&:time_intervals)
                         .concat(room_time_intervals)
                         .flatten
                         .select { |ti| (week_start..week_end).cover?(ti.start) }

    authorize! :read, plannings

    # @plannings = ActiveModelSerializers::SerializableResource.new(plannings, each_serializer: PlanningSerializer)
    @plannings = plannings.as_json(except: [:time_intervals])
    @intervals = ActiveModelSerializers::SerializableResource.new(intervals, each_serializer: TimeIntervalSerializer)
    @conflict = conflict.as_json(include: [:activity_instance])
    @season = Season.current.as_json({ include: [:holidays] })
  end

  def show_for_room
    @current_user = current_user
    @room = Room.find(params[:id])
    @room_json = @room.as_json(include: :activity_refs)
    @rooms = Room.order(:label).all
    room_refs = Room.includes(:location).all
    @room_refs = ActiveModelSerializers::SerializableResource.new(room_refs, each_serializer: RoomSerializer)
    @levels = EvaluationLevelRef.all
    @locations = Location.all.as_json
    @activity_refs = ActivityRef.all
    @evaluation_level_refs = EvaluationLevelRef.all
    @teachers = User.teachers.order(:last_name, :first_name).includes(:teachers_activity_refs,
                                                                      :planning).as_json(include: %i[
                                                                                           teachers_activity_refs planning
                                                                                         ])

    day = DateTime.now.to_date

    day = Date.parse(params[:day]) unless params[:day].nil?

    @day = day.beginning_of_week

    @season = Season.current.as_json({ include: [:holidays] })
    @next_season = Season.next.as_json({ include: [:holidays] })
    @seasons = Season.all.as_json({ include: [:holidays] })
  end

  def show_all_rooms
    @current_user = current_user
    @rooms = Room.order(:label).all.to_a
    # @room_refs = Room.all
    @levels = EvaluationLevelRef.all
    @locations = Location.all.as_json
    @activity_refs = ActivityRef.all
    @teachers = User.teachers.order(:last_name, :first_name).includes(:teachers_activity_refs,
                                                                      :planning).as_json(include: %i[
                                                                                           teachers_activity_refs planning
                                                                                         ])

    room_activities = Activity.includes(
      room: {},
      time_interval: {
        activity: {
          teachers_activities: {},
          time_interval: {
            plannings: [:user]
          },
          options: {
            desired_activity: {
              activity_application: {
                user: {}
              }
            }
          },
          activity_ref: {},
          users: {
            levels: [:evaluation_level_ref]
          },
          location: {}
        }
      }
    ).all

    room_activities_formated = room_activities
                                 .map(&:time_interval)
                                 .compact
                                 .group_by { |ti| ti.activity.room_id }
                                 .to_a
                                 .sort_by! { |ti| Room.find(ti[0]).label }

    @room_plannings = room_activities_formated.as_json({
                                                         include: {
                                                           activity: {
                                                             include: {
                                                               teachers_activities: {},
                                                               time_interval: {
                                                                 include: {
                                                                   plannings: {
                                                                     include: [:user]
                                                                   }
                                                                 }
                                                               },
                                                               options: {
                                                                 include: {
                                                                   desired_activity: {
                                                                     include: {
                                                                       additional_student: {
                                                                         include: [:user]
                                                                       },
                                                                       activity_application: {
                                                                         include: {
                                                                           user: {}
                                                                         }
                                                                       }
                                                                     }
                                                                   }
                                                                 }
                                                               },
                                                               activity_ref: {},
                                                               users: {
                                                                 include: {
                                                                   levels: { include: [:evaluation_level_ref] }
                                                                   # :activity_application => { :include => {:desired_activities => {:include => [:user]}} }
                                                                 }
                                                               },
                                                               location: {}
                                                             }
                                                           }
                                                         }
                                                       })
  end

  def show_availabilities
    planning = current_user.planning

    authorize! :read, planning

    @planning = planning
    @current_season = Season.current
    @next_season = Season.next
    @eval_season = @next_season.nil? ? @current_season : @next_season
  end

  def show_availabilities_for_date
    availabilities_date = params[:date]
    planning = Planning.includes({ user: {}, time_intervals: :comment }).find(params[:id])

    authorize! :read, planning

    next_season = Season.next
    current_season = Season.current

    day = availabilities_date.nil? ? next_season.start : availabilities_date.to_date
    day = day.beginning_of_week
    day_end = day.end_of_week
    kinds_filter = availabilities_date.nil? ? %w[p c o] : %w[p c o e]
    time_intervals = planning.time_intervals.where({ start: (day..day_end), kind: kinds_filter })

    # Template vars
    @current_user = current_user
    @day = day
    @day_end = day_end
    @for_season = availabilities_date.nil?
    @next_season = next_season
    @current_season = current_season
    @planning = PlanningSerializer.new(planning).as_json include: "user.*"

    # trouver la date de validation de la saison courante pour éventuellement afficher une alerte au prof
    @validation_date = Season.current.date_for_teacher_planning_validation
    @time_intervals = time_intervals.as_json(include: :comment)
    @locked = availabilities_date.nil? ? (@planning[:is_locked] && current_user.teacher?) : false
    @copy_link = url_for action: "copy_availabilities", id: planning.id
    @lock_link = url_for action: "lock", id: planning.id
  end

  def add_default_to_planning
    planning = Planning.find(params[:id])
    school = School.first
    season = params[:season_id].present? ? Season.find(params[:season_id]) : Season.current_apps_season || Season.current

    existing_intervals = planning.time_intervals.where({ start: (season.start..season.end), kind: "p" })

    render json: "already filled or planning locked", status: :bad_request and return if planning.is_locked || existing_intervals.count > 0

    if school.planning.nil?
      school.create_planning
      school.save!
    end

    # @type [Array<TimeInterval>]
    default_intervals =
      school.planning
        &.time_intervals
        &.where("kind = 'p'")
        &.where("EXTRACT(YEAR FROM start) = :year", year: season.start.year)
        &.where("date_trunc(:granularity, time_intervals.start AT TIME ZONE 'Europe/Paris') = date_trunc(:granularity, :date::date AT TIME ZONE 'Europe/Paris')", {
          granularity: 'week',
          date: season.start
        })
        &.to_a || []
    school_has_default = default_intervals.any?

    if default_intervals.empty?
      previous_season = season.previous
      default_intervals = school.planning&.time_intervals&.where(start: previous_season.start..previous_season.end)&.to_a || []
    end

    return render json: { message: "pas de planning par défaut de saisie par l'école" }, status: :not_found if default_intervals.empty?

    default_intervals = default_intervals.map do |interval|
      interval = interval.dup
      interval.id = nil

      interval.convert_to_first_week_of_season(season, false)

      interval
    end

    # also create default intervals for the school in case it doesn't have any for the season
    unless school_has_default
      school.planning.time_intervals << default_intervals
      school.planning.save!

      default_intervals = default_intervals.map do |interval|
        interval = interval.dup
        interval.id = nil # reset id to avoid conflict
      end
    end

    planning.time_intervals << default_intervals
    planning.save!

    render json: default_intervals
  end

  def update_availabilities
    # id = params[:id].nil? ? 0 : params[:id]
    intervals = TimeIntervals::CreateAvailabilities
                  .new(
                    params[:from],
                    params[:to],
                    params[:season_id] || Season.current_apps_season.id,
                    params[:id],
                    params[:comment])
                  .execute
    render json: { intervals: intervals.as_json(include: :comment) }
  rescue IntervalError => e
    render json: { errors: [e.message] }, status: :bad_request
  end

  def copy_availabilities
    intervals = TimeIntervals::CopyAvailabilities.new(params[:id], Season.current, Season.next,
                                                      %w[p c o]).execute
    redirect_to :availabilities_planning
  end

  def update
    planning = Planning.find(params[:id])
    intervals = planning.update_intervals(params[:intervals], params[:seasonId])
    planning.save

    # TODO: Move to own method, this is a gross hack
    if params[:conflictId]
      conflict = Conflict.find(params[:conflictId])
      conflict.is_resolved = true
      conflict.save
    end

    conflicts = intervals.map do |interval|
      interval.activity_instance ? interval.activity_instance.check_for_conflict : nil
    end

    intervals_json = ActiveModelSerializers::SerializableResource.new(intervals,
                                                                      each_serializer: TimeIntervalSerializer)

    render json: {
      intervals: intervals_json.as_json,
      conflicts: conflicts
    }
  end

  def incoherent_intervals
    students = []
    User.where(is_teacher: false, is_admin: false).each do |user|
      next unless user.students.any?

      user.planning.time_slots.each do |slot|
        if !slot.time_interval.activity.nil? && user.students.joins(:activity).where("activities.time_interval_id": slot.time_interval_id).none?
          students.push user
        end
      end
    end

    students = students.as_json(only: %i[first_name last_name])

    render json: students
  end

  def remove_incoherent_intervals
    # students = []
    User.where(is_teacher: false, is_admin: false).each do |user|
      next unless user.students.any?

      user.planning.time_slots.each do |slot|
        if !slot.time_interval.activity.nil? && user.students.joins(:activity).where("activities.time_interval_id": slot.time_interval_id).none?
          slot.destroy!
        end
      end
    end
  end

  def overlap
    teacher = nil
    modified = TimeInterval.new(start: params["startTime"], end: params["endTime"])

    time_intervals_teacher = TimeInterval.with_teacher(params["teacher_id"]).where("time_intervals.id != ?",
                                                                                   params["time_interval_id"])
    time_intervals_teacher.each do |ti|
      if ti.overlap_in_any_way?(modified)
        teacher = ti.as_json(include: { activity: { include: [:room] }, plannings: { include: [:user] } })
        break
      end
    end

    room = nil
    time_intervals_room = TimeInterval.in_room(params["room_id"]).where("time_intervals.id != ?",
                                                                        params["time_interval_id"])
    time_intervals_room.each do |ti|
      if ti.overlap_in_any_way?(modified)
        room = ti.as_json(include: { activity: { include: [:room] }, plannings: { include: [:user] } })
        break
      end
    end

    render json: { teacher: teacher, room: room }
  end

  def overlap_same_room
    res = []
    modified = TimeInterval.new(start: params["startTime"], end: params["endTime"])
    time_intervals = TimeInterval.in_room(params["room_id"]).where("time_intervals.id != ?", params["time_interval_id"])
    time_intervals.each do |ti|
      res.push(ti) if ti.overlap_in_any_way?(modified)
    end
    render json: res.first, include: [:activity]
  end

  def lock
    planning = Planning.find(params[:id])
    authorize! :edit, planning

    planning.is_locked = true
    planning.save
    redirect_to planning
  end

  def unlock
    planning = Planning.find(params[:id])
    authorize! :edit, planning

    planning.is_locked = false
    planning.save
    redirect_to planning
  end

  def toggle_lock
    planning = Planning.find(params[:id])
    authorize! :edit, planning

    planning.is_locked = !planning.is_locked
    planning.save
    redirect_to planning
  end
end
