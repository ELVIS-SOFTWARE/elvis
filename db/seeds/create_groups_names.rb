def determine_group_name(ref)
  if ref.activity_ref_kind.name == "ACTIONS CULTURELLES"
    "AC"
  elsif ref.activity_ref_kind.name == "CHAM"
    "CH"
  elsif ref.activity_ref_kind.name.include?("ATELIERS")
    "AT"
  elsif ref.label.include?("ind")
    "CI"
  else
    "CC"
  end
end

User.teachers.each do |teacher|
  Season.all.each do |season|
    counts = {}

      activities = teacher.season_teacher_activities(season)
          .includes({ activity_ref: { activity_ref_kind: {} } })
          .joins(:time_interval)
          .order("(extract(dow FROM start AT TIME ZONE 'GMT' AT TIME ZONE 'Europe/Paris')::text ||
                (start AT TIME ZONE 'GMT' AT TIME ZONE 'Europe/Paris')::time::text) asc")

      activities.each do |a|
        group_name = determine_group_name(a.activity_ref)
          if(!counts[group_name])
            counts[group_name] = 1
          end

          a.update(group_name: "#{group_name}#{counts[group_name]}")

          counts[group_name] += 1
      end
  end
end