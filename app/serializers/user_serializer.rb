# == Schema Information
#
# Table name: users
#
#  id                              :bigint           not null, primary key
#  email                           :string           default("")
#  encrypted_password              :string           default(""), not null
#  reset_password_token            :string
#  reset_password_sent_at          :datetime
#  remember_created_at             :datetime
#  sign_in_count                   :integer          default(0), not null
#  current_sign_in_at              :datetime
#  last_sign_in_at                 :datetime
#  current_sign_in_ip              :inet
#  last_sign_in_ip                 :inet
#  created_at                      :datetime         not null
#  updated_at                      :datetime         not null
#  confirmation_token              :string
#  confirmed_at                    :datetime
#  confirmation_sent_at            :datetime
#  first_name                      :string
#  last_name                       :string
#  sex                             :string
#  profession                      :string
#  school                          :string
#  is_admin                        :boolean          default(FALSE)
#  is_teacher                      :boolean          default(FALSE)
#  birthday                        :date
#  self_level                      :integer
#  solfege                         :boolean
#  handicap                        :boolean          default(FALSE)
#  handicap_description            :string
#  adherent_number                 :integer
#  evaluation_level_ref_id         :bigint
#  is_paying                       :boolean
#  is_accompanying                 :boolean
#  address_id                      :integer
#  deleted_at                      :datetime
#  authentication_token            :text
#  authentication_token_created_at :datetime
#  first_connection                :boolean          default(TRUE)
#  has_verified_infos              :boolean          default(FALSE)
#  checked_gdpr                    :boolean          default(FALSE)
#  checked_image_right             :boolean
#  checked_newsletter              :boolean
#  is_creator                      :boolean          default(FALSE)
#  organization_id                 :bigint
#

class UserSerializer < ActiveModel::Serializer
  has_many :levels

  attributes :id, :first_name, :last_name, :adherent_number, :birthday, :is_teacher, :activity_refs

  def activity_refs
    object.activity_refs.as_json(only: [:id, :label, :kind, :duration])
  end
end

