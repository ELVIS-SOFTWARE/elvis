module TimeIntervals
    class CreateAvailabilities
        def initialize(from, to, kind, planning_id, day, comment)
            @from = from
            @to = to
            @kind = kind
            @planning = Planning.includes(:time_intervals).find(planning_id)
            day_start = day.to_date
            day_end = day_start + 7.day
            @potential_conflicts = @planning
                .time_intervals
                .where({ start: (day_start..day_end) })
            @comment = comment
        end

        def execute
            # If specified interval is invalid, raise error
            # From time >= to time
            # OR From date != to date (inteval not on the same day)
            if @from.to_datetime >= @to.to_datetime || @from.to_date != @to.to_date
                raise IntervalError, "err_interval_bounds"
            end

            step_param = Parameter.find_by_label("INTERVAL_STEPS")
            steps = step_param.parse
            step = step_param.nil? || !steps.key?(@kind) ? 0 : steps[@kind] # Steps are expressed in minutes

            has_conflicts = false
            new_intervals = []
            TimeInterval.transaction do
                new_intervals = segment_interval(@from, @to, step).map{ |int|
                    interval = TimeInterval.new
                    interval.start = int[:start]
                    interval.end = int[:end]
                    interval.kind = @kind
                    interval.is_validated = false

                    if check_conflicts?(interval)
                        has_conflicts = true
                        nil
                    else
                        interval.save!
                        interval.create_comment!(content: @comment.strip, user: @planning.user) unless @comment.blank?
                        interval
                    end
                }
                .compact

                if new_intervals.length == 0 || has_conflicts
                    raise IntervalError, "err_interval_creation_failed"
                end
            end

            @planning.time_intervals << new_intervals
            @planning.save!

            new_intervals
        end

        private

        def segment_interval(from, to, step)
            intervals = []

            from_time = from.to_datetime
            to_time = to.to_datetime

            if step == 0
                intervals << { start: from_time, end: to_time }
            elsif (interval_count = ((to_time - from_time) * 1.day.in_minutes.to_i / step).to_f.floor - 1)

                for i in 0..interval_count
                    start_date = from_time + (i * step).minutes
                    end_date = start_date + step.minutes

                    intervals << { start: start_date, end: end_date }
                end
            end

            intervals
        end

        def check_conflicts?(interval)
            @potential_conflicts.each do |pc|
                if interval.kind == "p" && pc.kind == "p" && pc.overlap_in_any_way?(interval)
                    return true
                elsif interval.kind != "p" && pc.kind != "p" && pc.overlap_in_any_way?(interval)
                    return true
                end
            end

            return false
        end
    end
end