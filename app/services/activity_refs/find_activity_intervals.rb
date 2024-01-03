# frozen_string_literal: true

module ActivityRefs
  class FindActivityIntervals
    def initialize(season_id, activity_ref_id)
      @season_id = season_id
      @activity_ref_id = activity_ref_id
    end

    def execute
      # vars
      season = Season.find(@season_id)
      activity_ref = ActivityRef
                      .includes({ activities: {} })
                      .find(@activity_ref_id)

      activities = activity_ref
                   .activities
                   .includes(:time_interval)
                   .joins(:time_interval)
                   .where({ time_intervals: { start: (season.start..season.end) } })

      # return activities mapped by weekday of time_interval
      activities
        .uniq { |act| act.time_interval.start.strftime("%u%H%M") + act.time_interval.end.strftime("%u%H%M") }
        .reduce({}) { |obj, act|
          weekday = act.time_interval.start.to_date.wday
          obj[weekday] = [] unless obj.key?(weekday)

          obj[weekday] << act.time_interval.as_json(include: {
            :activity => {
              :include => {
                :location => {},
                :teacher => {},
              }
            },
          })

          # obj[weekday][0]["avatar_url"] = (act.teacher.avatar).to_s if act.teacher.avatar.attached?

          obj
        }
    end
  end
end
