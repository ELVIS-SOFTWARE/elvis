module Practices
    class GetRoomsSessions
        def initialize(rooms=nil, start=nil, stop=nil, band=nil)
            @rooms = rooms ? rooms : Room.practice
            @band = band ? band : Band.all
            @start = start ? start : Time.now.beginning_of_day
            @stop = stop ? stop : Time.now.beginning_of_day + 1.day
        end

        def execute
            return PracticeSession.time_interval_by_period(@start, @stop)
              .where(room: @rooms)
              .where(band: @bands)
        end
    end
end