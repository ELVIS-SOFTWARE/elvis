# == Schema Information
#
# Table name: time_intervals
#
#  id           :bigint           not null, primary key
#  start        :datetime
#  end          :datetime
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  kind         :string
#  is_validated :boolean          default(FALSE)
#

class TimeIntervalSerializer < ActiveModel::Serializer
  # include FastJsonapi::ObjectSerializer
  has_one :activity_instance

  attributes :id, :start, :end, :is_validated, :kind, :updated_at
end
