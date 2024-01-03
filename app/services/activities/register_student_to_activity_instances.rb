module Activities

  # inscrit l'étudiant spécifié dans la DesiredActivity comme participant des instances du cours Activity
  # à partir de la date spécifiée dans la DesiredActivity
  class RegisterStudentToActivityInstances
    def initialize(activity_id, desired_activity_id, is_option = false, from_date = nil, to_date = nil)
      @activity = Activity.find(activity_id)
      @desired_activity = DesiredActivity
                            .includes(:activity_application => :user)
                            .find(desired_activity_id)

      @from_date = from_date || @desired_activity.activity_application.begin_at
      @to_date = to_date
      @is_option = is_option
    end

    def execute
      ActivityApplication.transaction do

        intervals_to_link_user_to = []
        student = @desired_activity.activity_application.user

        # registering student as attendant of each instance
        instances = @activity
                      .activity_instances
                      .joins(:time_interval)

        if @from_date
          instances = instances.where("(start AT TIME ZONE 'Europe/Paris')::date >= ?::date", @from_date)
        end

        if @to_date
          instances = instances.where("(start AT TIME ZONE 'Europe/Paris')::date <= ?::date", @to_date)
        end

        instances.each do |inst|
          inst.student_attendances.create_with(is_option: @is_option).find_or_create_by!(user: student)
          intervals_to_link_user_to << inst.time_interval_id
        end

        # register instances in their planning
        student.link_to_intervals(intervals_to_link_user_to)
      end
    end
  end
end
