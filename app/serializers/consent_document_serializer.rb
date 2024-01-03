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
class ConsentDocumentSerializer < ActiveModel::Serializer
  include Rails.application.routes.url_helpers

  attributes :id, :index, :title, :content, :attached_filename, :expected_answer, :attached_file_url

end
