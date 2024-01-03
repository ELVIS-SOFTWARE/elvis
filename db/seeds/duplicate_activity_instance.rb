TimeInterval.transaction do
    start = Date.iso8601("2021-06-14")
    stop = Date.iso8601("2021-06-20")
    Activity.includes({activity_instances: :time_interval})
        .where(time_intervals: {start: start..stop})
        .each{|activity| 
            intervals = activity.create_instances
            intervals.map(&:activity_instance).each do |ins|
                activity.users.each do |u|
                    StudentAttendance.create!(user: u, activity_instance: ins)
                end
            end
        }
end