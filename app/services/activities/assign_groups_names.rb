module Activities
  class AssignGroupsNames
    def initialize(teacher, season)
      @teacher = teacher
        @season = season
    end

    def execute
        activities = @teacher.season_teacher_activities(@season)
            .includes({
                :activity_ref => {activity_ref_kind: {}},
                :time_interval => {},
                :teachers_activities => {
                    :teacher => {},
                },
            })
            .joins(:time_interval)
            .order(Arel.sql("(extract(dow FROM start AT TIME ZONE 'GMT' AT TIME ZONE 'Europe/Paris')::text ||
                    (start AT TIME ZONE 'GMT' AT TIME ZONE 'Europe/Paris')::time::text) asc"))

        Activity.transaction do
          activities.update_all(group_name: nil)

          activities_to_group_name = {}

          activities.each do |a|
            group_name = determine_group_name(a.activity_ref)

            activities_to_group_name[group_name] ||= []
            activities_to_group_name[group_name] << a.id
          end

          activities_to_group_name.each_value { |tab| tab.sort! }

          update_object = []

          # faire en deux fois pour bien être sur de l'ordre (grace au sort)
          activities_to_group_name.each do |group_name, activities_ids|
            activities_ids.each_with_index do |activity_id, index|
              update_object << {id: activity_id, group_name: "#{group_name}#{index + 1}"}
            end
          end

          Activity.update update_object.map { |o| o[:id] }, update_object.map { |o| {group_name: o[:group_name]} }
        end
    end
  end
end

def determine_group_name(ref)
  if ref.activity_type == "actions_culturelles"
    "AC"
  elsif ref.activity_type == "cham"
    "CH"
  elsif ref.activity_ref_kind.name.include?("ATELIERS")
    "AT"
  elsif ref.activity_type == "child"
    "ENF"
  elsif ref.label.include?("ind")
    "CI"
  else
    "CC"
  end
end
