class DropFamilyMembers < ActiveRecord::Migration[6.1]
  def change
    drop_table :family_members
  end
end
