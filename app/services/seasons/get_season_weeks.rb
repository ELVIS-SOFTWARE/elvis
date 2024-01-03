module Seasons
  class GetSeasonWeeks
    def execute
      season = Season.current

      from = Time.now.to_date.beginning_of_week
      to = season.end.to_date.end_of_week

      (from..to).each_with_object({}) do |date, dates|
        dates[date.year] = {} if dates[date.year].nil?
        dates[date.year][date.month] = [] if dates[date.year][date.month].nil?

        start_of_week = date.to_date.beginning_of_week
        end_of_week = date.to_date.end_of_week

        dates[date.year][date.month] << { from: start_of_week, to: end_of_week } if start_of_week == date.to_date
      end
    end
  end
end
