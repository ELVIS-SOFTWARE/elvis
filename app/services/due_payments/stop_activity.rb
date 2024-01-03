module DuePayments
  class StopActivity
    #@param [ActivityApplication] application
    def initialize(application)
      @application = application
    end

    def execute
      desired_activities = @application.desired_activities

      DesiredActivity.transaction do
        ActivityApplications::UnregisterStudentFromActivityInstances
          .new(@application, @application.stopped_at)
          .execute

        desired_activities.includes(:activity).each do |des|
          des.update(
            prorata: des.activity.calculate_prorata_for_student(@application.user_id)
          ) unless des.activity_id.nil?
        end

      end
    end
  end
end