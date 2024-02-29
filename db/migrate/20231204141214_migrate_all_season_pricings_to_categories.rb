class MigrateAllSeasonPricingsToCategories < ActiveRecord::Migration[6.1]
  def up
    if Object.const_defined?(:Pricing)
      Pricing.all.each do |pricing|
        pc = PricingCategory.create!(id: pricing.id, name: pricing.label, is_a_pack: false)
        pricing.activity_ref_season_pricings.each do |season_pricing|
          puts season_pricing.inspect
          arp = ActivityRefPricing.new(activity_ref_id: season_pricing.activity_ref_id, price: season_pricing.price, pricing_category_id: pc.id, from_season_id: season_pricing.season_id, to_season_id: season_pricing.season_id)
          arp.save! validate: false # on ignore les validations pour éviter les erreurs lorsque l'ActivityRef a été soft-deleted
        end
      end
    end
  end

  def down
    ActivityRefPricing.destroy_all if const_defined?(:ActivityRefPricing)
    PricingCategory.destroy_all if const_defined?(:PricingCategory)
  end
end
