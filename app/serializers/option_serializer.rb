# == Schema Information
#
# Table name: options
#
#  id                  :bigint           not null, primary key
#  desired_activity_id :integer
#  activity_id         :integer
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  deleted_at          :datetime
#

class OptionSerializer < ActiveModel::Serializer
  # include FastJsonapi::ObjectSerializer

  has_one :activity

  attributes :id
end
