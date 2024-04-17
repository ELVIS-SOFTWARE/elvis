# == Schema Information
#
# Table name: plannings
#
#  id          :bigint           not null, primary key
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  user_id     :bigint
#  hours_count :float            default(0.0)
#  is_locked   :boolean          default(FALSE)
#

class Planning < ApplicationRecord
    belongs_to :user, optional: true

    has_many :time_slots, dependent: :destroy
    has_many :time_intervals, through: :time_slots
    has_many :time_intervals_csv, through: :time_slots, source: :time_interval_csv

    has_many :planning_conflicts
    has_many :conflicts, through: :planning_conflicts


    def self.display_class_name(singular = true)
      singular ? "planning" : "planning"
    end

    def self.class_name_gender
      return :M
    end

    def update_intervals(intervals, season_id)
        intervalList = Array.new()

        season = nil
        if !season_id.blank?
            season = Season.find(season_id)
        end

        intervals.each do |i|
            if i["isNew"] == true
                interval = TimeInterval.new
            else
                interval = TimeInterval.find_or_initialize_by(id: i['id'])
            end
            interval.start = i["start"]
            interval.end = i["end"]
            if !season.nil?
                interval.convert_to_first_week_of_season(season)
            end
            interval.kind = i["kind"] || "d"
            interval.is_validated = i["is_validated"] || false
            interval.save

            if self.time_intervals.where(id: interval.id).none?
                intervalList << interval
            end
        end

        self.time_intervals << intervalList
        return intervalList
    end

    def create_availability(time_interval)
      season = Season.next
      week_start = season.start.beginning_of_week
      week_end = season.start.end_of_week
      week_range = (week_start.to_date..week_end.to_date).step(1.day).each { |d| d }.to_a
      week_day = time_interval.start.wday
      target_day = week_range.select { |day| day.wday == week_day }.first

      new_availability = time_interval.dup
      new_availability.start = new_availability.start.change(year: target_day.year, month: target_day.month, day: target_day.day)
      new_availability.end = new_availability.end.change(year: target_day.year, month: target_day.month, day: target_day.day)
      new_availability.kind = "p"
      new_availability.is_validated = false
      new_availability.save

      self.time_intervals << new_availability
      self.save
    end
end
