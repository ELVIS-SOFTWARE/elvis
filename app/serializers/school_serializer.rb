# == Schema Information
#
# Table name: schools
#
#  id                                     :bigint           not null, primary key
#  name                                   :string
#  created_at                             :datetime         not null
#  updated_at                             :datetime         not null
#  address_id                             :bigint
#  phone_number                           :string
#  email                                  :string
#  logo                                   :string
#  academy                                :string
#  zone                                   :string
#  siret_rna                              :string
#  legal_entity                           :string
#  billing_contact_id                     :string
#  instance_size                          :string
#  planning_id                            :bigint
#  entity_subject_to_vat                  :boolean          default(FALSE)
#  activities_not_subject_to_vat          :boolean          default(FALSE)
#  rcs                                    :string
#
class SchoolSerializer < ActiveModel::Serializer
  include Rails.application.routes.url_helpers

  has_one :address

  attributes :id, :name, :phone_number, :email, :academy, :zone, :logo, :siret_rna, :rcs,:activities_not_subject_to_vat, :entity_subject_to_vat

  def logo
    return object.logo.filename if object.logo.attached?

    nil
  end
end
