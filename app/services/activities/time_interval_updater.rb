# frozen_string_literal: true

module Activities
  class TimeIntervalUpdater

    def initialize(activity_instance_id, new_time_interval_id)
      @activity_instance = ActivityInstance.find(activity_instance_id)
      @new_time_interval = TimeInterval.find(new_time_interval_id)
    end

    def execute
      new_time_intervals = @new_time_interval.generate_for_rest_of_season.select { |i| i[:start] != @new_time_interval.start || i[:end] != @new_time_interval.end }
      instances_to_update = @activity_instance.activity.activity_instances.select { |instance| instance.time_interval.start > @new_time_interval.start }
      instances_to_check = instances_to_update


      new_time_intervals.each do |new_time_interval|
        # For each instance, we need to find the time_interval that is the same week
        corresponding_activity_instance = instances_to_update.select { |activity_instance| activity_instance.time_interval.start.strftime("%U") == new_time_interval[:start].strftime("%U") }.first

        if corresponding_activity_instance.nil?
          new_interval = TimeInterval.create(start: new_time_interval[:start], end: new_time_interval[:end], kind: 'c', is_validated: true)
          corresponding_activity_instance = ActivityInstance.create(time_interval: new_interval, room: instance.room, location: instance.location, activity: instance.activity)
          instances_to_check << corresponding_activity_instance
        end

        ti = corresponding_activity_instance.time_interval
        ti.change_start_and_end(new_time_interval[:start], new_time_interval[:end])
        ti.save
      end

      instances_to_check
    end

  end

end