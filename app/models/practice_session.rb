# == Schema Information
#
# Table name: practice_sessions
#
#  id               :bigint           not null, primary key
#  band_id          :integer
#  time_interval_id :integer
#  room_id          :integer
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#
class PracticeSession < ApplicationRecord
    belongs_to :time_interval
    belongs_to :band
    belongs_to :room

    scope :time_interval_by_date, ->(date) {
        joins(:time_interval).where({time_intervals: {start: date}})
    }

    scope :time_interval_by_period, ->(start, stop) {
        joins(:time_interval).where({time_intervals: {start: [start..stop], end: [start..stop]}})
    }

    def self.display_class_name(singular = true)
        singular ? "séance de répétition" : "séances de répétition"
    end

    def self.class_name_gender
        return :M
    end

end
