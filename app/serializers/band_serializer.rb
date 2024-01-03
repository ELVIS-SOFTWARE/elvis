# == Schema Information
#
# Table name: bands
#
#  id             :bigint           not null, primary key
#  name           :string           not null
#  blacklisted    :boolean          default(FALSE), not null
#  music_genre_id :bigint
#  band_type_id   :bigint
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#

class BandSerializer < ActiveModel::Serializer
  attributes :id, :name, :blacklisted
end
