# == Schema Information
#
# Table name: desired_locations
#
#  id                      :bigint           not null, primary key
#  created_at              :datetime         not null
#  updated_at              :datetime         not null
#  activity_application_id :bigint
#  location_id             :bigint
#

class DesiredLocation < ApplicationRecord
    belongs_to :location
    belongs_to :activity_application

    def self.display_class_name(singular = true)
        singular ? "lieu souhaité" : "lieux souhaités"
    end

    def self.class_name_gender
        return :M
    end

end
