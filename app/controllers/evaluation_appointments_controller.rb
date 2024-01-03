class EvaluationAppointmentsController < ApplicationController
  def index
    evaluation_availabilities = TimeInterval
                                .includes(:evaluation_appointment)
                                .evaluation
                                .available
                                .select { |ti| ti.evaluation_appointment.nil? }

    authorize! :manage, evaluation_availabilities

    @evaluation_availabilities = evaluation_availabilities.as_json(methods: :teacher).select { |ti| ti["teacher"] }

    @rooms = Room.includes(:activity_refs).all.as_json(include: :activity_refs)

    @evaluation_availabilities.each do |ti|
      ti["evaluation_appointments"] = EvaluationAppointment
                                      .includes(:time_interval)
                                      .joins(:time_interval)
                                      .joins(:teacher)
                                      .where("time_intervals.start >= ? AND time_intervals.end <= ?", DateTime.parse(ti["start"]), DateTime.parse(ti["end"]))
                                      .where(teacher_id: ti["teacher"]["id"])
                                      .as_json(include: %i[time_interval teacher student activity_ref room])

      ti["teacher"] = ti["teacher"]&.as_json(include: :teachers_activity_refs)
    end
  end

  def incomplete
    @current_user = current_user

    @season = Season.next || Season.current
    previous_season = @season.previous

    @season_json = @season.as_json(methods: :previous)

    @activity_refs = ActivityRef.evaluable.all

    @unassigned_students = NewStudentLevelQuestionnaire
                           .includes({
                                       user: {
                                         evaluation_appointments: {},
                                         activity_applications: :desired_activities
                                       },
                                       activity_ref: {}
                                     })
                           .joins(answers: :question)
                           .where({ # Student has experience
                                    answers: {
                                      value: "true",
                                      questions: {
                                        name: "already_practiced_instrument"
                                      }
                                    },
                                    season: @season
                                  })
                           .where("(
            SELECT COUNT(*)
            FROM evaluation_appointments ea
            WHERE ea.student_id = new_student_level_questionnaires.user_id
            AND ea.season_id = new_student_level_questionnaires.season_id
            AND ea.activity_ref_id = new_student_level_questionnaires.activity_ref_id
        ) = 0") # But no appointment
                           .uniq { |nslq| [nslq.activity_ref_id, nslq.user_id] }
                           .map do |nslq|
      activity_ref = nslq.activity_ref.as_json

      activity_application = nslq.user.activity_applications.find do |a|
        a.desired_activities.find do |da|
          da.activity_ref_id == nslq.activity_ref_id
        end
      end

      evaluation_appointment = nslq.user.evaluation_appointments.find do |ea|
        ea.season == @season && ea.activity_ref == nslq.activity_ref
      end.as_json(include: %i[teacher time_interval room])

      nslq.user.as_json.merge({ activity_ref: activity_ref, activity_application: activity_application,
                                evaluation_appointment: evaluation_appointment })
    end

    # INSERT ABOVE UNIQ

    @available_intervals = TimeIntervals.available_appointments(previous_season)

    @teachers = User.teachers
                    .includes(teachers_activity_refs: :activity_ref)
                    .as_json(include: {
                               teachers_activity_refs: {
                                 include: :activity_ref
                               }
                             })

    authorize! :manage, @teachers, @available_intervals, @unassigned_students
  end

  def without_interval
    @appointments = EvaluationAppointment
                    .includes(:student, :season)
                    .where(time_interval_id: nil, teacher_id: nil, season: Season.next)

    authorize! :read, @appointments

    render json: @appointments.as_json(include: %i[student activity_ref])
  end

  def create
    authorize! :create, EvaluationAppointment

    EvaluationAppointment.transaction do
      teacher = User.find(params[:teacher_id])
      room = Room.find(params[:room_id])
      activity_ref = ActivityRef.find(params[:activity_ref_id])

      time_interval = TimeInterval.create!(
        start: DateTime.parse(params[:start].to_s),
        end: DateTime.parse(params[:end].to_s),
        kind: "e",
        is_validated: true
      )

      season = Season
               .find_by("? BETWEEN seasons.start AND seasons.start + interval '1 year'", DateTime.parse(params[:start].to_s))
          &.next

      appointment = EvaluationAppointment.create!(
        room: room,
        season: season,
        teacher: teacher,
        activity_ref: activity_ref,
        time_interval: time_interval
      )

      teacher.planning.time_slots.find_or_create_by!(time_interval: time_interval)

      render json: appointment.as_json(include: %i[room time_interval activity_ref teacher])
    end
  end

  def update
    @evaluation_appointment = EvaluationAppointment.find(params[:id])

    authorize! :manage, @evaluation_appointment

    @student = nil
    @activity_application = nil

    if params[:student_id] && params[:activity_application_id]
      @student = User.find(params[:student_id])
      @activity_application = ActivityApplication.find(params[:activity_application_id])
    end

    begin
      res = EvaluationAppointments::CreateOrUpdate
            .new(
              @student,
              @activity_application,
              @evaluation_appointment.activity_ref,
              @evaluation_appointment.teacher,
              @evaluation_appointment.time_interval,
              @evaluation_appointment.season
            )
            .execute
    rescue IntervalTakenError => e
      render status: 400, json: { errors: [e.message] } and return
    end

    render json: res[:result].as_json(include: %i[
                                        student
                                        time_interval
                                        teacher
                                        activity_ref
                                      ])
  end
end
