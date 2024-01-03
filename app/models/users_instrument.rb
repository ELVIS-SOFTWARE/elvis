# == Schema Information
#
# Table name: users_instruments
#
#  id            :bigint           not null, primary key
#  user_id       :bigint
#  instrument_id :bigint
#

class UsersInstrument < ApplicationRecord
    belongs_to :user
    belongs_to :instrument

    def self.display_class_name(singular = true)
        singular ? "association utilisateur / instrument" : "associations utilisateurs / instruments"
    end

    def self.class_name_gender
        return :F
    end

end
