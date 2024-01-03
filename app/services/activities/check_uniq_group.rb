module Activities
    class CheckUniqGroup
        def initialize(group_name, teacher, time_interval)
            @group_name = group_name
            @teacher = teacher
            @season = Season.from_interval(time_interval).first
        end

        def execute
            activities_w_same_name = Activity
                .includes(:teachers_activities => :teacher)
                .joins(:time_interval)
                .where({ time_intervals: {start: (@season.start..@season.end)} })
                .where(:teachers_activities => { teacher: @teacher })
                .where(group_name: @group_name)
                .empty?

            activities_w_same_name
        end
    end
end