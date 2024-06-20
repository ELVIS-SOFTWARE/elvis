class MaxActivityRefPriceForSeason < ApplicationRecord
  belongs_to :season

  belongs_to :target, polymorphic: true

  validates :season, :target, presence: true
end
