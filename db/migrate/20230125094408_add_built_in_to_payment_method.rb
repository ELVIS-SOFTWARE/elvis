class AddBuiltInToPaymentMethod < ActiveRecord::Migration[6.1]
  def self.up
    add_column :payment_methods, :built_in, :boolean, default: false
  end

  def self.down
    remove_column :payment_methods, :built_in
  end
end
