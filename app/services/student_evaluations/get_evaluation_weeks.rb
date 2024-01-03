module StudentEvaluations
    class GetEvaluationWeeks
        def execute
            next_season = Season.next
            current_season = Season.current

            year = next_season.nil? ? current_season.end.year : next_season.start.year

            fromMonth = Time.new(year, 6, 1)
            toMonth = Time.new(year, 9, 1)

            from = fromMonth.to_date.beginning_of_month.beginning_of_week
            to = toMonth.to_date.end_of_month.end_of_week
        
            weeks = (from..to).reduce({}){ |dates, date|
                dates[date.year] = {} unless !dates[date.year].nil?
                dates[date.year][date.month] = [] unless !dates[date.year][date.month].nil?
        
                start_of_week = date.to_date.beginning_of_week
                end_of_week = date.to_date.end_of_week  
        
                if start_of_week == date.to_date
                    dates[date.year][date.month] << { from: start_of_week, to: end_of_week }
                end
        
                dates
            }

            weeks
        end
    end
end