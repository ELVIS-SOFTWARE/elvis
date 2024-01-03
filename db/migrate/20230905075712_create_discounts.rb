class CreateDiscounts < ActiveRecord::Migration[6.1]
  def change
    create_table :discounts do |t|
      t.references :coupon, null: false, foreign_key: true
      t.references :discountable, polymorphic: true, null: false

      t.timestamps
    end
  end
end
