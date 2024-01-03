class ChangeColumnsToNotNullInDiscounts < ActiveRecord::Migration[6.1]
  def change
    change_column_null :discounts, :coupon_id, false
    change_column_null :discounts, :discountable_id, false
    change_column_null :discounts, :discountable_type, false
  end
end
