# == Schema Information
#
# Table name: time_slots
#
#  id               :bigint           not null, primary key
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  time_interval_id :bigint
#  planning_id      :bigint
#

class TimeSlot < ApplicationRecord
    belongs_to :planning
    belongs_to :time_interval
    belongs_to :time_interval_csv, -> { select(:id, :start, :is_validated, :end) }, class_name: "TimeInterval", required: false

    def self.display_class_name(singular = true)
        singular ? "créneau de planning" : "créneaux des plannings"
    end

    def self.class_name_gender
        return :M
    end

end
