# == Schema Information
#
# Table name: levels
#
#  id                      :bigint           not null, primary key
#  evaluation_level_ref_id :integer
#  activity_ref_id         :integer
#  user_id                 :integer
#  created_at              :datetime         not null
#  updated_at              :datetime         not null
#  season_id               :bigint
#  can_continue            :boolean
#

class LevelSerializer < ActiveModel::Serializer
  # include FastJsonapi::ObjectSerializer
  belongs_to :evaluation_level_ref
  belongs_to :activity_ref

  attributes :evaluation_level_ref_id, :activity_ref_id, :season_id, :id, :user_id
end
