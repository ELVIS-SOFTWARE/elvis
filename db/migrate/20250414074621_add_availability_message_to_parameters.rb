class AddAvailabilityMessageToParameters < ActiveRecord::Migration[6.0]
  def up
    Parameter.create!(
      label: 'availability_message',
      value: 'Sélectionner plusieurs créneaux de disponibilités, vous aurez ainsi plus de possibilités d\'inscription.',
      value_type: 'string'
    )
  end

  def down
    Parameter.find_by(label: 'availability_message')&.destroy
  end
end
