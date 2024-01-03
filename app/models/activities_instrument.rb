# == Schema Information
#
# Table name: activities_instruments
#
#  id            :bigint           not null, primary key
#  activity_id   :bigint
#  instrument_id :bigint
#  user_id       :bigint
#  is_validated  :boolean          default(FALSE)
#  attempt_date  :datetime
#

class ActivitiesInstrument < ApplicationRecord
    belongs_to :activity
    belongs_to :instrument, optional: true
    
    belongs_to :user, optional: true

    def self.display_class_name(singular = true)
        singular ? "association cours/instruments" : "associations cours/instruments"
    end

    def self.class_name_gender
        return :F
    end

end
