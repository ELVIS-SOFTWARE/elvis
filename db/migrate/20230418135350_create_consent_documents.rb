class CreateConsentDocuments < ActiveRecord::Migration[6.1]
  def change
    create_table :consent_documents do |t|
      t.string :title
      t.string :content
      t.string :attached_file
      t.boolean :expected_answer  # true, false ou null

      t.timestamps
    end
  end
end
