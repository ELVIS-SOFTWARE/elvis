# == Schema Information
#
# Table name: room_activities
#
#  id              :bigint           not null, primary key
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  room_id         :bigint
#  activity_ref_id :bigint
#

class RoomActivity < ApplicationRecord
    belongs_to :room
    belongs_to :activity_ref

    def self.display_class_name(singular = true)
        singular ? "association activité / salle" : "associations activités / salles"
    end

    def self.class_name_gender
        return :F
    end

end
