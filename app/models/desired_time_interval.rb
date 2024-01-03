# == Schema Information
#
# Table name: desired_time_intervals
#
#  id                      :bigint           not null, primary key
#  created_at              :datetime         not null
#  updated_at              :datetime         not null
#  activity_application_id :bigint
#  time_interval_id        :bigint
#

class DesiredTimeInterval < ApplicationRecord
    belongs_to :activity_application
    belongs_to :time_interval

    def self.display_class_name(singular = true)
        singular ? "créneau souhaité" : "créneaux souhaités"
    end

    def self.class_name_gender
        return :M
    end

end
