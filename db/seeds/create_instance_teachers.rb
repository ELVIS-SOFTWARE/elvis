Activity.includes(:activity_instances).all.each_with_index do |a, i|
    teacher = a.teacher

    a.activity_instances.each do |ins|
        ins.teachers_activity_instances.create(user_id: teacher.id, is_main: true)
        ins.save!
    end

    print("\r#{i}/#{Activity.count}")
end