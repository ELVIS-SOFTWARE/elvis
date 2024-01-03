class ChangeValidInCoupons < ActiveRecord::Migration[6.1]
  def change
    rename_column :coupons, :valid, :enabled
  end
end
