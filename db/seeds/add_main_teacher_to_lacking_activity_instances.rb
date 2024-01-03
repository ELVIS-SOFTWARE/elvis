# Ajouter le professeur principal des cours à toutes les instances en manquant.
ActivityInstance.includes({activity: {teachers_activities: :teacher}}).joins("LEFT JOIN teachers_activity_instances tai ON tai.is_main AND tai.activity_instance_id = activity_instances.id").where("tai.* IS NULL").find_each(batch_size: 500) do |ai|
    ai.teachers_activity_instances.create!(teacher: ai.activity.teacher, is_main: true)
end