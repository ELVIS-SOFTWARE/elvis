class RemovedBillingContactIdFromSchool < ActiveRecord::Migration[6.1]
  def self.up
    remove_column :schools, :billing_contact_id
  end

  def self.down
    add_column :schools, :billing_contact_id, :string
  end
end
