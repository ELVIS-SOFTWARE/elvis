class AddIdOrganizationToUsers < ActiveRecord::Migration[6.1]
  def change
    add_reference :users, :organization, foreign_key: true, null:true
  end
end
