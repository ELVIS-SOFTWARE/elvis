class DropFamilyMemberContacts < ActiveRecord::Migration[6.1]
  def change
    drop_table :family_member_contacts
  end
end
