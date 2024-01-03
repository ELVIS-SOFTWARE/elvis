# == Schema Information
#
# Table name: locations
#
#  id         :bigint           not null, primary key
#  label      :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#

class Location < ApplicationRecord
    has_many :room
    validates :label, uniqueness: true

    def self.display_class_name(singular = true)
        singular ? "lieu" : "lieux"
    end

    def self.class_name_gender
        return :M
    end

end
