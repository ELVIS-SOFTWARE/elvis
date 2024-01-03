s = Season.find(5) # cela correspond à la saison 2020-2022 sur la prod, à changer si besoin

vendredi15 = DateTime.parse "2021-10-15" # changer ces deux date pour les autres vacance si besoin
samedi16 = DateTime.parse "2021-10-16T23:59" # mettre 23h59 car sinon ce n'est que les cours entre vendredi minuit et samedi minuit qui seront sélectionnés

activities = ActivityInstance.joins(:time_interval).where({ time_intervals: { start: (vendredi15..samedi16) } })

instances = []

activities.each do |instance|
  a = instance.activity

  d = instance.time_interval.start + 1.week
  duration = instance.time_interval.end - instance.time_interval.start

  if ActivityInstance.includes(:time_interval).joins(:time_interval).where(activity_id: a.id, time_intervals: { start: d, end: (d + duration) }).any?
    next
  end

  new_instance = instance.dup
  new_instance.time_interval = instance.time_interval.dup
  new_instance.time_interval.start = d
  new_instance.time_interval.end = d + duration
  new_instance.student_attendances << a.students.map(&:user).map { |u| StudentAttendance.new(user: u) }
  new_instance.teachers_activity_instances.new(teacher: a.teacher)

  instances << new_instance

  a.activity_instances << new_instance
  a.teacher.planning.time_intervals << new_instance.time_interval
  a.students.map(&:user).map(&:planning).each { |p| p.time_intervals << new_instance.time_interval }
end
