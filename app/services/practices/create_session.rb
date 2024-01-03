module Practices
    class CreateSession
        def initialize(band, room, start, stop)
            @band= band
            @room= room
            @start =start
            @stop = stop
        end

        def execute
            interval = TimeInterval.create!(
                start: @start,
                end: @stop,
                kind: "practice",
            )
            return PracticeSession.create!(
                band: @band,
                room: @room,
                time_interval: interval,
            )
        end
    end
end