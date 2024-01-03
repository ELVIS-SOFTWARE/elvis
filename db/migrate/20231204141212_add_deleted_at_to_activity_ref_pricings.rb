class AddDeletedAtToActivityRefPricings < ActiveRecord::Migration[6.1]
  def change
    add_column :activity_ref_pricings, :deleted_at, :datetime
    add_index :activity_ref_pricings, :deleted_at
  end
end
