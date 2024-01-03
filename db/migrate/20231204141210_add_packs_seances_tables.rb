class AddPacksSeancesTables < ActiveRecord::Migration[6.1]
  def change
    create_table :pricing_categories do |t|
      t.string :name, null: false
      t.integer :number_lessons, null: false
      t.boolean :is_a_pack, null: false

      t.timestamps
    end

    create_table :activity_ref_pricings do |t|
      t.references :activity_ref, null: false, foreign_key: true
      t.date :from, null: false
      t.date :to
      t.integer :price, null: false
      t.references :pricing_category, null: false, foreign_key: true

      t.timestamps
    end

    create_table :packs do |t|
      t.references :user, null: false, foreign_key: true
      t.references :activity_ref_pricing, null: false, foreign_key: true
      t.references :season, null: false, foreign_key: true
      t.bigint :lessons_remaining, null: false

      t.timestamps
    end
  end
end
