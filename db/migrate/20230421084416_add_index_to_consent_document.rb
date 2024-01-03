class AddIndexToConsentDocument < ActiveRecord::Migration[6.1]
  def change
    add_column :consent_documents, :index, :integer
  end
end
