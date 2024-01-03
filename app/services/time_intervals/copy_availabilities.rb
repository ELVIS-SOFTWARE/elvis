module TimeIntervals
    class CopyAvailabilities
        def initialize(planning_id, from_season, to_season, kinds)
            @planning = Planning.includes(:time_intervals).find(planning_id)
            @from_season = from_season
            @to_season = to_season
            @kinds = kinds
        end

        def execute
            src_day_start = @from_season.start.to_date.beginning_of_week
            src_day_end = src_day_start + 7.day
            src_intervals = @planning.time_intervals.where({ start: (src_day_start..src_day_end), kind: @kinds })

            target_day_start = @to_season.start.to_date.beginning_of_week
            target_day_end = target_day_start + 7.day
            target_intervals = []

            TimeInterval.transaction do
                # We first remove any interval on the beginning week of the season
                intervals_to_remove = @planning.time_intervals.where({ start: (target_day_start..target_day_end), is_validated: false })
                intervals_to_remove.destroy_all

                # Then we copy the intervals from the previous season
                target_intervals = src_intervals.map{ |src| 
                    from = src.start.to_datetime
                    to = src.end.to_datetime

                    interval = TimeInterval.new
                    interval.kind = src.kind
                    interval.is_validated = false
                    interval.start = Time.zone.local(
                        target_day_start.year,
                        target_day_start.month,
                        target_day_start.day,
                        from.hour,
                        from.minute
                      ) + (from.wday - 1).day

                    interval.end = Time.zone.local(
                        target_day_start.year,
                        target_day_start.month,
                        target_day_start.day,
                        to.hour,
                        to.minute
                      ) + (from.wday - 1).day
    
                    interval.save!
                    interval
                }
            end

            @planning.time_intervals << target_intervals
            @planning.save!

            target_intervals
        end
    end
end