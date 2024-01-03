# == Schema Information
#
# Table name: activity_refs_instruments
#
#  id              :bigint           not null, primary key
#  activity_ref_id :bigint
#  instrument_id   :bigint
#

class ActivityRefsInstrument < ApplicationRecord
    belongs_to :activity_ref
    belongs_to :instrument

    def self.display_class_name(singular = true)
        singular ? "association activité / instruments" : "associations activité / instruments"
    end

    def self.class_name_gender
        return :F
    end

end
