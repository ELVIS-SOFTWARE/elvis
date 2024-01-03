# == Schema Information
#
# Table name: band_types
#
#  id         :bigint           not null, primary key
#  name       :string           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#

class BandType < ApplicationRecord
    has_many :bands

    validates :name, presence: true

    def self.display_class_name(singular = true)
        singular ? "type de groupe de musique" : "type de groupe de musique"
    end

    def self.class_name_gender
        return :M
    end


    def to_s
        name
    end
end
