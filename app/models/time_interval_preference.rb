# == Schema Information
#
# Table name: time_interval_preferences
#
#  id                      :bigint           not null, primary key
#  user_id                 :bigint
#  season_id               :bigint
#  time_interval_id        :bigint
#  activity_ref_id         :bigint
#  rank                    :integer
#  activity_application_id :bigint
#

class TimeIntervalPreference < ApplicationRecord
    belongs_to :user
    belongs_to :season
    belongs_to :time_interval
    belongs_to :activity_ref
    belongs_to :activity_application

    def self.display_class_name(singular=false)
        singular ? "préférence horaire" : "préférences horaires"
    end

    def self.class_name_gender
        return :F
    end


end
