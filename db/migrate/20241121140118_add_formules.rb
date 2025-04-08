class AddFormules < ActiveRecord::Migration[6.1]
  def change
    create_table :formules do |t|
      t.string :name
      t.string :description
      t.boolean :active, default: true
      t.timestamps
      t.timestamp :deleted_at, null: true
    end

    create_table :formule_pricings do |t|
      t.references :formule, foreign_key: true
      t.references :pricing_category, foreign_key: true
      t.references :from_season, foreign_key: { to_table: :seasons }
      t.references :to_season, foreign_key: { to_table: :seasons }, optional: true

      t.float :price
      t.timestamps
    end

    create_table :formule_items do |t|
      t.references :formule, foreign_key: true
      t.references :item, polymorphic: true
      t.timestamps
    end
  end
end
