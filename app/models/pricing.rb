# == Schema Information
#
# Table name: pricings
#
#  id    :bigint           not null, primary key
#  label :string           not null
#


# DEPRECATED # Remplacé par PricingCategories
class Pricing < ApplicationRecord
    has_many :activity_ref_season_pricings
    has_many :activity_refs, through: :activity_ref_season_pricings
    has_many :seasons, through: :activity_ref_season_pricings

    def self.display_class_name(singular = true)
        singular ? "tarif" : "tarifs"
    end

    def self.class_name_gender
        return :M
    end

end
