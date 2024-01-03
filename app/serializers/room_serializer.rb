# == Schema Information
#
# Table name: rooms
#
#  id               :bigint           not null, primary key
#  label            :string
#  kind             :string
#  floor            :integer
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  image            :string
#  location_id      :bigint
#  is_practice_room :boolean
#  area             :float            default(0.0)
#

class RoomSerializer < ActiveModel::Serializer
  # include FastJsonapi::ObjectSerializer
  has_one :location
  has_many :room_activities

  attributes :id, :label, :kind, :location_id
end
