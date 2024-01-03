class ReaddMissingColumn < ActiveRecord::Migration[6.1]
  def change
    add_column :schools, :rcs, :string, null: true unless column_exists?(:schools, :rcs)
  end
end
