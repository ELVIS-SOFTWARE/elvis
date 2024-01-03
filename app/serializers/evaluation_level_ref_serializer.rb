# == Schema Information
#
# Table name: evaluation_level_refs
#
#  id           :bigint           not null, primary key
#  value        :integer
#  label        :string
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  can_continue :boolean          default(FALSE)
#

class EvaluationLevelRefSerializer < ActiveModel::Serializer
  # include FastJsonapi::ObjectSerializer
  attributes :id, :value, :label
end
