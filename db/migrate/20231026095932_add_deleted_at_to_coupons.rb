class AddDeletedAtToCoupons < ActiveRecord::Migration[6.1]
  def change
    add_column :coupons, :deleted_at, :datetime
    add_index :coupons, :deleted_at
  end
end
