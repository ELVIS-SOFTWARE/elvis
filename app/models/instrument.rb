# == Schema Information
#
# Table name: instruments
#
#  id    :bigint           not null, primary key
#  label :string
#

class Instrument < ApplicationRecord
    has_many :activities_instruments, dependent: :destroy
    has_many :activities, through: :activities_instruments

    has_many :activity_refs_instruments, dependent: :destroy
    has_many :activity_refs, through: :activity_refs_instruments

    has_many :users_instruments, dependent: :destroy
    has_many :users, through: :users_instruments

    def self.display_class_name(singular = true)
        singular ? "instrument" : "instruments"
    end

    def self.class_name_gender
        return :M
    end


    def to_s
        label
    end
end
