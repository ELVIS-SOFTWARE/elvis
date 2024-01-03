class AddUniqueIndexToDiscounts < ActiveRecord::Migration[6.1]
  def change
    add_index :discounts, [:discountable_type, :discountable_id], unique: true
  end
end
