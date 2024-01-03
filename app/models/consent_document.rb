# == Schema Information
#
# Table name: consent_documents
#
#  id              :bigint           not null, primary key
#  title           :string
#  content         :string
#  attached_file   :string
#  expected_answer :boolean
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  index           :integer
#
class ConsentDocument < ApplicationRecord
  has_one_attached :attached_file

  attribute :attached_filename
  validates :title, presence: true, uniqueness: true

  has_many :consent_document_users, dependent: :destroy

  def self.has_consented?(id, user_id)
    ConsentDocumentUser.where(consent_document_id: id, user_id: user_id).first&.has_consented
  end

  def self.display_class_name(singular = true)
    singular ? "document de consentement" : "documents de consentement"
  end

  def self.class_name_gender
    return :M
  end

  def attached_filename
    attached_file.filename.to_s if attached_file.attached?
  end

  def to_json(*args)
    ConsentDocumentSerializer.new(self).to_json args
  end

  def as_json(options = nil)
    ConsentDocumentSerializer.new(self).as_json options
  end

  def attached_file_url
    self.attached_file.attached? ?
      Rails.application.routes.url_helpers.rails_blob_path(self.attached_file, only_path: true) :
      nil
  end

  def self.jsonize_consent_document_query(query)
    res = query.as_json(
      except: [:created_at, :updated_at, :deleted_at, :attached_file],
      methods: [:attached_file_url]
    )

    res
  end
end
