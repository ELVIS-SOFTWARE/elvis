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

class AddressSerializer < ActiveModel::Serializer
    # include FastJsonapi::ObjectSerializer
  
    attributes :id, :street_address, :postcode, :city, :department, :country
  end
  
