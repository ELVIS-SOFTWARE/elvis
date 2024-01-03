class AddBuiltInToPayments < ActiveRecord::Migration[6.1]
  def self.up
    add_column :payment_statuses, :built_in, :boolean, default: false
    add_column :due_payment_statuses, :built_in, :boolean, default: false
  end

  def self.down
    remove_column :payment_statuses, :built_in
    remove_column :due_payment_statuses, :built_in
  end
end
