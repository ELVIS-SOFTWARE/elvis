module EvaluationAppointments
    class AssignStudent
        def initialize(time_interval, student, activity_application)
            @evaluation_appointment = EvaluationAppointment
                .joins(:time_interval)
                .find_by(time_interval: time_interval)
            @student = student
            @activity_application = activity_application
        end

        def execute
            # lock resource
            @evaluation_appointment.with_lock("FOR UPDATE") do
                raise AppointmentTakenError, "err_evaluation_interval_already_taken" if !@evaluation_appointment.student.nil?
                
                # and assign student to appointment
                @evaluation_appointment.update!(
                    student: @student,
                    activity_application: @activity_application,
                )
            end

            @student.planning.time_intervals << @evaluation_appointment.time_interval
        end
    end
end