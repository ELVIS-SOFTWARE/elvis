class UpdateTypeOfPriceInActivityRefpricings < ActiveRecord::Migration[6.1]
  def up
    change_column :activity_ref_pricings, :price, :float
  end

  def down
    change_column :activity_ref_pricings, :price, :integer
  end
end
