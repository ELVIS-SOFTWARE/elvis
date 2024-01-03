# == Schema Information
#
# Table name: music_genres
#
#  id         :bigint           not null, primary key
#  name       :string           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#

class MusicGenre < ApplicationRecord
    has_many :bands

    validates :name, presence: true

    def self.display_class_name(singular = true)
        singular ? "genre musical" : "genres musicaux"
    end

    def self.class_name_gender
        return :M
    end


    def to_s
        name
    end
end
