class CreateErrorHistories < ActiveRecord::Migration[6.1]
  def change
    create_table :error_histories do |t|

      t.string :message, null: true
      t.jsonb :stack_trace, null: false, default: '[]'
      t.jsonb :related_objects, null: false, default: '{}'

      t.timestamps

      t.references :error_code, null: false, foreign_key: true
    end
  end
end
