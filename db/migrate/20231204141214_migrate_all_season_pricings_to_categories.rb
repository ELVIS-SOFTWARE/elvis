class MigrateAllSeasonPricingsToCategories < ActiveRecord::Migration[6.1]
  def up

    # verify if table pricings exists. return if not
    return unless ActiveRecord::Base.connection.table_exists?(:pricings)

    pricings = ActiveRecord::Base.connection.execute("SELECT * FROM pricings")
    pricings.each do |pricing|
      pc = PricingCategory.create!(id: pricing['id'], name: pricing['label'], is_a_pack: false)
      ActiveRecord::Base.connection.execute("SELECT * FROM activity_ref_season_pricings WHERE pricing_id = #{pricing['id']}").each do |season_pricing|
        puts season_pricing.inspect
        arp = ActivityRefPricing.new(activity_ref_id: season_pricing['activity_ref_id'], price: season_pricing['price'], pricing_category_id: pc.id, from_season_id: season_pricing['season_id'], to_season_id: season_pricing['season_id'])
        arp.save! validate: false # on ignore les validations pour éviter les erreurs lorsque l'ActivityRef a été soft-deleted
      end
    end

  end

  def down
    return unless ActiveRecord::Base.connection.table_exists?(:pricings)

    ActiveRecord::Base.connection.execute("DELETE FROM activity_ref_pricings")
    ActiveRecord::Base.connection.execute("DELETE FROM pricing_categories")
  end

end
