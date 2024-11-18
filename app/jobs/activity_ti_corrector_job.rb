# frozen_string_literal: true

# find all activities without time_interval and use first time_interval of first activity instance in datetime order.
class ActivityTiCorrectorJob < ApplicationJob

  def perform
    activities_without_ti = Activity.joins(:activity_instances).where.not(time_interval_id: TimeInterval.ids).distinct

    puts_s = []

    Activity.transaction do
      activities_without_ti.find_in_batches(batch_size: 1000) do |activities|
        puts_s << "Processing batch of #{activities.size} activities"
        activities.each do |activity|
          first_activity_instance = activity.activity_instances.joins(:time_interval).order("time_intervals.start").first
          if first_activity_instance.present?
            puts_s << "Activity #{activity.id} has no time_interval, setting it from #{activity.time_interval_id} to #{first_activity_instance.time_interval_id}"

            activity.time_interval_id = first_activity_instance.time_interval_id

            # do not validate because group_name is invalid at this point.
            activity.save!(validate: false)

            Activities::AssignGroupsNames
              .new(activity.teacher, Season.from_interval(first_activity_instance.time_interval).first)
              .execute
          end
        end
      end
    end

    puts puts_s.join("\n")
  end
end
