module ActivityApplications
  class UnregisterStudentFromActivityInstances
    def initialize(application, from_date = nil, to_date = nil)
      @application = application
      @user = application.user
      @from_date = from_date
      @to_date = to_date
    end

    # This service removes links between the target user and lesson.
    # A specific date may be given, which will be used to only remove
    # the user from instances which happen past the given date.
    def execute
      ActivityApplication.transaction do
        @application
          .desired_activities
          .map(&:activity)
          .compact
          .each do |act|
          intervals_to_unlink_user_from = []

          instances = act
                        .activity_instances
                        .joins(:time_interval)

          if @from_date
            instances = instances.where("(start AT TIME ZONE 'Europe/Paris')::date >= ?::date", @from_date)
          end

          if @to_date
            instances = instances.where("(start AT TIME ZONE 'Europe/Paris')::date <= ?::date", @to_date)
          end

          # delete student's attendances from instances
          instances.each do |inst|
            inst.student_attendances.where(user: @user).destroy_all
            # Store the intervals which need to
            # be removed from the user's planning.
            intervals_to_unlink_user_from << inst.time_interval_id
          end

          # remove the intervals from user's planning
          @user.planning.time_slots
               .where(time_interval_id: intervals_to_unlink_user_from)
               .destroy_all
        end
      end
    end
  end
end