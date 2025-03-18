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
#  planning_id                            :bigint
#  entity_subject_to_vat                  :boolean          default(FALSE)
#  activities_not_subject_to_vat          :boolean          default(FALSE)
#  rcs                                    :string
#
class School < ApplicationRecord
  has_one_attached :logo
  belongs_to :address, required: false
  belongs_to :planning, required: false
  has_many :formules

  def self.display_class_name(singular = true)
    singular ? "école" : "écoles"
  end

  def self.class_name_gender
    return :F
  end


  def self.school_name
    School.first&.name
  end

  def to_json(*args)
    SchoolSerializer.new(self).to_json args
  end

  def as_json(options = nil)
    SchoolSerializer.new(self).as_json options
  end

  def phone_number
    tel = self[:phone_number]&.strip

    if tel.present? && !tel.start_with?("+")
      tel = "+33#{tel[1..-1]}" # TODO: handle other countries
    end

    tel
  end
end
