# == Schema Information
#
# Table name: adhesion_prices
#
#  id         :bigint           not null, primary key
#  label      :string
#  price      :float
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  season_id  :bigint
#
class AdhesionPrice < ApplicationRecord
  belongs_to :season, optional: true

  has_many :adhesions, dependent: :restrict_with_error

  validates_presence_of :label, message: "Le libellé est obligatoire"
  validates_presence_of :price, message: "Le prix est obligatoire"
  validates_numericality_of :price, :greater_than_or_equal_to => 0, message: "Le prix doit être supérieur ou égal à 0"

  validates_uniqueness_of :season_id, message: "Il existe déjà un tarif pour cette saison", allow_nil: true
end
