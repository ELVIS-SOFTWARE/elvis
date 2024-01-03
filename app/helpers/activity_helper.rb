module ActivityHelper
    def format_for_display(activity)

        ref = activity.activity_ref.label
        start_time = activity.time_interval.start.strftime("%H:%M")
        end_time = activity.time_interval.end.strftime("%H:%M")
        wday = localize activity.time_interval.start, format: "%A"

        "#{activity.group_name} #{ref} (#{wday} de #{start_time} à #{end_time})"
    end
end