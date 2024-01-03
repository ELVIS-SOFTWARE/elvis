# == Schema Information
#
# Table name: music_genres
#
#  id         :bigint           not null, primary key
#  name       :string           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#

class MusicGenreSerializer < ActiveModel::Serializer
  attributes :id, :name
end
