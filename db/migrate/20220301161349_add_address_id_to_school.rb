class AddAddressIdToSchool < ActiveRecord::Migration[6.1]
  def change
    add_belongs_to :schools, :address
  end
end
