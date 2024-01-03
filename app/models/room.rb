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

class Room < ApplicationRecord
  update_index("salles") { self }

  def run_chewy_callbacks
    base_chewy_callbacks
  end

  has_many :room_activities
  has_many :activity_refs, through: :room_activities
  belongs_to :location
  has_one_attached :picture
  has_many :practice_session
  has_many :room_room_features
  has_many :activities
  has_many :activity_instances

  scope :practice, -> { where(is_practice_room: true) }

  validates :label, presence: true

  def self.display_class_name(singular = true)
    singular ? "salle" : "salles"
  end

  def self.class_name_gender
    return :F
  end


  # Permet de savoir si une salle est référencée dans une autre table.
  # Solution manuelle qui me semblais la plus propre. Il faut ajouter les conditions si d'autres refs sont ajoutées.
  #
  # J'ai pensé à tenter un destroy ou delete avec un try-catch (begin-rescue) permettant de voir si c'est possible
  # de supprimer. (et un rollback dans le cas de la réussite.) Mais cela me semblais être une mauvaise façon de faire.
  def ref?
    !(room_room_features.empty? && activity_refs.empty? && room_activities.empty? && practice_session.empty? &&
      room_room_feature_ids.empty? && activity_ref_ids.empty? && room_activity_ids.empty?)
  end

  def self.for_user_activities(user)
    rooms = []

    user.activity_refs.each do |a|
      rooms << all.select { |r| r.activity_refs.include?(a) }
    end

    rooms.flatten.uniq
  end
end
