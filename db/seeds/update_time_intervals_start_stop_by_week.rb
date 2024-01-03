# Delay all the courses from `start` to `stop` by `delay` time
TimeInterval.transaction do
    # from sunday to sunday
    start = Date.iso8601("2021-04-18")
    stop = Date.iso8601("2021-04-25")
    delay = 2.week
    TimeInterval
        .where(
            kind:"c",
            start: start..stop
        )
        .each do |ti|
            ti.start += delay
            ti.end += delay
            ti.save
        end
end

# moves Holidays between 2 dates
Holiday.transaction do
    start = Date.iso8601("2021-05-03")
    stop = Date.iso8601("2021-05-09")
    delay = 2.week
    Holiday.where(
            label:"Vacances de Printemps", 
            date: start..stop
        ).each do |h|
            h.date -= delay
            h.save
        end
end