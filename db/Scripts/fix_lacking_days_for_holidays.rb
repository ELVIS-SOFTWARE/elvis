s = Season.find(5) # cela correspond à la saison 2020-2022 sur la prod, à changer si besoin

# les jours sur lesquels il manque des cours à cause du fait qu'il y ait des vacances dessus
dates = [DateTime.parse("2021-12-17"),DateTime.parse("2021-12-18"),DateTime.parse("2022-02-04"),DateTime.parse("2022-02-05"),DateTime.parse("2022-04-08"),DateTime.parse("2022-04-09")]

Activity.transaction do
  dates.each do |date|
    activities = Activity.includes(:time_interval).joins(:time_interval).where({time_intervals: {start: (s.start..s.end)}}).where("extract(dow from time_intervals.start) = extract(dow from ?::date)", date)

    activities.each do |activity|
      if ActivityInstance.joins(:time_interval).where(activity: activity).where("time_intervals.start::date = ?::date", date).any?
        next
      end

      d = activity.time_interval.start + (date.to_date - activity.time_interval.start.to_date).days
      duration = activity.time_interval.end - activity.time_interval.start

      time_interval = TimeInterval.new(start: d, end: d + duration, kind: 'c', is_validated: true)

      instance = ActivityInstance.new
      instance.time_interval = time_interval
      instance.room_id = activity.room_id
      instance.location_id = activity.location_id
      instance.activity_id = activity.id
      instance.save
      
      instance.student_attendances << activity.students.map(&:user).map { |u| StudentAttendance.new(user: u) }
      instance.teachers_activity_instances << TeachersActivityInstance.new(teacher: activity.teacher)

      # add interval to teacher and students plannings
      ([activity.teacher] + activity.students.map(&:user)).map(&:planning).each { |p| p.time_intervals << instance.time_interval}
    end
  end
end