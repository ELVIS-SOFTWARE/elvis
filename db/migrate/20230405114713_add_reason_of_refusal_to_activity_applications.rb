class AddReasonOfRefusalToActivityApplications < ActiveRecord::Migration[6.1]
  def change
    add_column :activity_applications, :reason_of_refusal, :string
  end
end
