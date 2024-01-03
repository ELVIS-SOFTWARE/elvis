class CreateConsentDocumentUsers < ActiveRecord::Migration[6.1]
  def change
    create_table :consent_document_users do |t|
      t.references :consent_document, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.boolean :has_consented, null: true

      t.timestamps
    end
  end
end
