# == Schema Information
#
# Table name: band_types
#
#  id         :bigint           not null, primary key
#  name       :string           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#

class BandTypeSerializer < ActiveModel::Serializer
  attributes :id, :name
end
