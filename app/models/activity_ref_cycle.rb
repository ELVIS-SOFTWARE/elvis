# == Schema Information
#
# Table name: activity_ref_cycles
#
#  id                   :bigint           not null, primary key
#  from_activity_ref_id :bigint
#  to_activity_ref_id   :bigint
#

class ActivityRefCycle < ApplicationRecord
    belongs_to :from, class_name: :ActivityRef, foreign_key: :from_activity_ref_id
    belongs_to :to, class_name: :ActivityRef, foreign_key: :to_activity_ref_id


    def self.display_class_name(singular = true)
        singular ? "enchainement d'activités" : "enchainements d'activités"
    end

    def self.class_name_gender
        return :M
    end

end
