# == Schema Information
#
# Table name: room_room_features
#
#  id               :bigint           not null, primary key
#  room_id          :bigint
#  room_features_id :bigint
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#
class RoomRoomFeature < ApplicationRecord
  belongs_to :room
  belongs_to :room_features

  def self.display_class_name(singular = true)
    singular ? "association salle / caractéristiques" : "associations salles / caractéristiques"
  end

  def self.class_name_gender
    return :F
  end

end
