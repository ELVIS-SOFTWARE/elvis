module Activities
    # Assign student to each instance,
    # add intervals to their planning,
    # add student to activity list
    # and validate the student desired_activity
    class AddStudent
        def initialize(activity_id, desired_activity_id, is_option = false)
            @activity = Activity.find(activity_id)
            @desired_activity = DesiredActivity
                .includes({
                    :activity_application => {
                        :user => {},
                    },
                })
                .find(desired_activity_id)
            @is_option = is_option
        end

        def execute
            Activity.transaction do
                # adding the student to the activity
                student = @desired_activity.activity_application.user
                if @is_option
                    @desired_activity.add_option(@activity.id)
                else
                    @activity.students.find_or_create_by!(user: student)
                end

                Activities::RegisterStudentToActivityInstances
                    .new(@activity.id, @desired_activity.id, @is_option)
                    .execute
    
                # validate their desired activity
                unless @is_option
                    # create adhesion if necessary
                    if Time.now.month == 6
                        validity_start_date = Time.new(Time.now.year, 7, 5, 0, 0, 0) # 5 JUILLET
                    else
                        validity_start_date = Time.now
                    end
                    student.adhesions
                        .create_with(
                            validity_start_date: validity_start_date,
                            validity_end_date: validity_start_date + 1.year,
                            is_active: true,
                        )
                        .find_or_create_by!(season: @desired_activity.activity_application.season)

                    # validating desired_activity and setting its activity to current
                    @desired_activity.is_validated = true
                    @desired_activity.activity = @activity
                end

                @desired_activity.save
            end
        end
    end
end