# == Schema Information
#
# Table name: room_features
#
#  id     :bigint           not null, primary key
#  name   :string
#  active :boolean          default(FALSE)
#
class RoomFeatures < ApplicationRecord

  def self.display_class_name(singular = true)
    singular ? "caractéristique de salle" : "caractéristiques des salles"
  end

  def self.class_name_gender
    return :F
  end

end
