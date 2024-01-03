# == Schema Information
#
# Table name: addresses
#
#  id             :bigint           not null, primary key
#  street_address :string
#  postcode       :string
#  city           :string
#  department     :string
#  country        :string
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#  kind           :string
#

class Address < ApplicationRecord
    has_many :user_addresses
    has_many :users, through: :user_addresses


    def self.display_class_name(singular = true)
      singular ? "adresse" : "adresses"
    end

    def self.class_name_gender
      return :F
    end


    def display
      "#{self.street_address}, #{self.postcode} #{self.city}"
    end
end
