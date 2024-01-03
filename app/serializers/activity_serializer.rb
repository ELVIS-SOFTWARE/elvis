# == Schema Information
#
# Table name: activities
#
#  id                                  :bigint           not null, primary key
#  created_at                          :datetime         not null
#  updated_at                          :datetime         not null
#  time_interval_id                    :bigint
#  activity_ref_id                     :bigint
#  room_id                             :bigint
#  location_id                         :bigint
#  group_name                          :string
#  evaluation_level_ref_id             :bigint
#  next_season_evaluation_level_ref_id :bigint
#

class ActivitySerializer < ActiveModel::Serializer
  # include FastJsonapi::ObjectSerializer
  # has_many :activity_instances
  has_many :options
  has_many :users
  has_one :activity_ref
  has_one :room
  has_one :teacher
  belongs_to :location

  attributes :id, :group_name
end
