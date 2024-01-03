class CreateAdhesionPrices < ActiveRecord::Migration[6.1]
  def up
    create_table :adhesion_prices do |t|
      t.string :label
      t.float :price

      t.timestamps

      t.references :season, null: true, foreign_key: true
    end

    add_column :adhesions, :adhesion_price_id, :integer, null: true
    add_foreign_key :adhesions, :adhesion_prices, column: :adhesion_price_id
  end

  def down
    drop_table :adhesion_prices

    remove_foreign_key :adhesions, column: :adhesion_price_id
    remove_column :adhesions, :adhesion_price_id
  end
end
