module EvaluationAppointments
    class CreateOrUpdate
        def initialize(student, activity_application, activity_ref, teacher, time_interval, season)
            @student = student
            @activity_application = activity_application
            @activity_ref = activity_ref
            @teacher = teacher
            @time_interval = time_interval
            @season = season
        end

        def execute 
            appointment = nil
            EvaluationAppointment.transaction do
                # validate interval with lock to avoid concurrency problems
                if !@time_interval.is_validated
                    @time_interval.with_lock("FOR UPDATE") do
                        raise IntervalTakenError, "err_evaluation_interval_already_taken" if @time_interval.is_validated

                        @time_interval.update!(is_validated: true)
                    end
                end

                appointment = EvaluationAppointment.find_or_create_by!(
                    teacher: @teacher,
                    time_interval: @time_interval,
                    season: @season,
                    activity_ref: @activity_ref
                )

                if @student != appointment.student
                    # Remove time interval from old student's planning
                    appointment.student&.unlink_from_intervals(appointment.time_interval_id)
                    @student&.link_to_intervals([@time_interval.id])
                end

                if @activity_application&.id != appointment.activity_application_id
                    inform_student_status = ActivityApplicationStatus.find_by(label: "Informer adhérent du créneau d'évaluation")
                    @activity_application&.update(activity_application_status: inform_student_status) if inform_student_status
                end

                appointment.update!(
                    student: @student,
                    activity_application: @activity_application,
                )
            end

            {
                error: nil,
                result: appointment,
            }
        end
    end
end
