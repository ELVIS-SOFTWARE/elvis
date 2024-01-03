# == Schema Information
#
# Table name: activity_ref_season_pricings
#
#  id              :bigint           not null, primary key
#  activity_ref_id :bigint           not null
#  season_id       :bigint           not null
#  pricing_id      :bigint
#  price           :float            default(0.0)
#


# DEPRECATED # Remplacé par ActivityRefPricing
class ActivityRefSeasonPricing < ApplicationRecord
    belongs_to :activity_ref
    belongs_to :season
    belongs_to :pricing, optional: true

    def self.display_class_name(singular = true)
        singular ? "tarif d'activité par saison" : "tarifs d'activité par saison"
    end

    def self.class_name_gender
        return :M
    end

end
