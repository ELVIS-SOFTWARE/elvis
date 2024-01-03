# == Schema Information
#
# Table name: consent_document_users
#
#  id                  :bigint           not null, primary key
#  consent_document_id :bigint           not null
#  user_id             :bigint           not null
#  has_consented       :boolean
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#
class ConsentDocumentUser < ApplicationRecord
  belongs_to :consent_document
  belongs_to :user

  validates :consent_document, uniqueness: { scope: :user }
end
