# frozen_string_literal: true

module Scripts
  class ReplicateActivities

    def initialize(replicate_on_vac, dates = [], season = Season.current)
      @dates = []

      @season = season

      dates.each do |date|
        d = nil
        d = date if date.is_a? DateTime
        d = DateTime.parse(date) if date.is_a? String

        next if !d.nil? && Holiday.where({ date: d.to_date }).any? && !replicate_on_vac

        @dates << d unless d.nil?
      end
    end

    def execute_with_last_week
      Activity.transaction do
        @dates = @dates.map { |date| date - 1.week }

        activities = []

        @dates.each do |date|
          ActivityInstance
            .includes(:time_interval)
            .joins(:time_interval)
            .where({ time_intervals: { start: (date.beginning_of_day)..(date.end_of_day) } })
            .each { |act| activities << act }
        end

        instances = []

        activities.each do |instance|
          a = instance.activity

          d = instance.time_interval.start + 1.week
          duration = instance.time_interval.end - instance.time_interval.start

          if a.teacher.nil? || ActivityInstance.includes(:time_interval).joins(:time_interval).where(activity_id: a.id, time_intervals: { start: d, end: (d + duration) }).any?
            next
          end

          new_instance = instance.dup
          new_instance.time_interval = TimeInterval.new(start: d, end: d + duration, kind: 'c', is_validated: true)
          new_instance.time_interval.start = d
          new_instance.time_interval.end = d + duration
          new_instance.student_attendances << a.students.map(&:user).map { |u| StudentAttendance.new(user: u) }
          new_instance.teachers_activity_instances.new(teacher: a.teacher)

          instances << new_instance

          a.activity_instances << new_instance
          a.teacher.planning.time_intervals << new_instance.time_interval
          a.students.map(&:user).map(&:planning).each { |p| p.time_intervals << new_instance.time_interval }
        end

        instances.each(&:save!)
      end
    end

    def execute_with_first_week
      Activity.transaction do
        @dates.each do |date|
          activities = Activity
                       .includes(:time_interval)
                       .joins(:time_interval)
                       .where({ time_intervals: { start: (@season.start..@season.end) } })
                       .where("extract(dow from time_intervals.start) = extract(dow from ?::date)", date)

          activities.each do |activity|
            if ActivityInstance.joins(:time_interval).where(activity: activity).where("time_intervals.start::date = ?::date", date).any?
              next
            end

            d = activity.time_interval.start + (date.to_date - activity.time_interval.start.to_date).days
            duration = activity.time_interval.end - activity.time_interval.start

            time_interval = TimeInterval.new(start: d, end: d + duration, kind: 'c', is_validated: true)

            instance = ActivityInstance.new
            instance.time_interval = time_interval
            instance.room_id = activity.room_id
            instance.location_id = activity.location_id
            instance.activity_id = activity.id
            instance.save

            instance.student_attendances << activity.students.map(&:user).map { |u| StudentAttendance.new(user: u) }
            instance.teachers_activity_instances << TeachersActivityInstance.new(teacher: activity.teacher)

            # add interval to teacher and students plannings
            ([activity.teacher] + activity.students.map(&:user)).map(&:planning).each { |p| p.time_intervals << instance.time_interval }
          end
        end
      end
    end
  end
end
