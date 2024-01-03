module TimeIntervals
    def TimeIntervals.available_appointments(season, do_format = true)
        intervals = TimeInterval
            .evaluation
            .validated
            .includes(:evaluation_appointment)
            .where({
                :start => season.start..(season.start + 1.year),
                :evaluation_appointments => {
                    :student_id => nil,
                    :activity_application_id => nil,
                },
            })

        intervals = intervals.as_json(:include => {
                :evaluation_appointment => {
                    :include => [:teacher, :room, :activity_ref]
                }
            }) if do_format

        return intervals
    end
end