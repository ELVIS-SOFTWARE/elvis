class AddDefaultPricingCategories < ActiveRecord::Migration[6.1]
  DEFAULT_CATEGORIES = %w[Annuel Mensuel].freeze

  def up
    # Recale la séquence d'id sur MAX(id) pour éviter les collisions de clé primaire
    # sur les bases où elle a été désynchronisée (imports manuels). No-op sur une base saine.
    execute(<<~SQL)
      SELECT setval(
        pg_get_serial_sequence('pricing_categories', 'id'),
        COALESCE((SELECT MAX(id) FROM pricing_categories), 0) + 1,
        false
      )
    SQL

    # Crée les catégories de prix par défaut si elles n'existent pas déjà (idempotent).
    DEFAULT_CATEGORIES.each do |category_name|
      PricingCategory.find_or_create_by!(name: category_name) do |pc|
        pc.is_a_pack = false
      end
    end
  end

  def down
    PricingCategory.where(name: DEFAULT_CATEGORIES).destroy_all
  end
end
