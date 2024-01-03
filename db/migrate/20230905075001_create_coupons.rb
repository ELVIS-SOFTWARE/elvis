class CreateCoupons < ActiveRecord::Migration[6.1]
  def change
    create_table :coupons do |t|
      t.string :label
      t.float :percent_off
      t.boolean :valid, default: true

      t.timestamps
    end
  end
end
