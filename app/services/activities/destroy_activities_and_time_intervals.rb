# frozen_string_literal: true
module Activities
  class DestroyActivitiesAndTimeIntervals
    def initialize(activity)
      @activity = activity

      time_interval = activity.time_interval
      if time_interval
        time_interval.is_validated = false
        time_interval.save!
      end
    end

    def execute
      ActiveRecord::Base.transaction do
        instances = ActivityInstance.where(activity_id: @activity.id).where.not(time_interval_id: @activity.time_interval_id)

        @activity.destroy!

        instances.each do |instance|
          instance.time_interval&.destroy!
          instance.destroy!
        end
      end
    end
  end
end
