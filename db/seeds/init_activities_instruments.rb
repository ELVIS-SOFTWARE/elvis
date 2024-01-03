activities = Activity
    .includes(:activity_ref => :instruments)
    .joins(:time_interval)
    .where(activity_refs: {is_work_group: true})
    .where("(select count(*) from activities_instruments ai where ai.activity_id = activities.id) = 0")

count = activities.count

Activity.transaction do
    activities
        .find_each.with_index do |a, i|
            if a.users.any? || a.options.any?
                options_users = a.options
                    .map{|o| o&.desired_activity&.activity_application&.user}
                    .compact
                    .uniq

                students_users = a.users.compact
                
                # instantiate users in group without instrument
                students_users.each do |u|
                    a.activities_instruments.create!(user: u, is_validated: true)
                end

                options_users.each do |u|
                    a.activities_instruments.create!(user: u, is_validated: false)
                end
            else
                # instantiate template instruments
                a.update!(instruments: a.activity_ref.instruments)
            end

            print("\r(#{i+1}/#{count})")
        end
end

print("\n")