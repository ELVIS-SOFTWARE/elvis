# frozen_string_literal: true
#require 'memory_profiler'

module Scripts
  class ReplicateWeekActivities < ApplicationJob
    include ActiveJob::Status

    # @param (TrueClass,FalseClass) replicate_on_vac true pour répliquer mêmes les vacances et jours fériés
    # @param (Date) ref_week_date un jour (quelconque) de la semaine-modèle
    # @param (Date) target_date_start la date de début pour la réplication
    # @param (Date) target_date_end la date de fin pour la réplication
    def perform(replicate_on_vac, ref_week_date, target_date_start, target_date_end)

      status[:step] = "Initialisation"
      setup(replicate_on_vac, ref_week_date, target_date_start, target_date_end)

      replicated_count = 0
      progress.total = @target_dates.count
      status[:step] = "Réplication en cours"
      #MemoryProfiler.start


      @target_dates.each do |target_date|
        ref_date = get_ref_date_for(target_date)
        status[:step] = "#{target_date} (#{replicated_count} séances répliquées)"

        # on réplique toutes les séances de cours de la +ref_date+ vers la date +target_date+
        activity_instances_on(ref_date).find_each do |inst_to_dup|
          activity = inst_to_dup.activity

          # nouvelle date de début
          d = target_date.in_time_zone.change({
                                                hour: inst_to_dup.time_interval.start.hour,
                                                min: inst_to_dup.time_interval.start.min,
                                              })

          duration = inst_to_dup.time_interval.end - inst_to_dup.time_interval.start

          ActivityInstance.transaction do
            # on passe au suivant si pas de prof ou si la séance de cours existe déjà
            next if activity.teacher.nil?
            next if ActivityInstance.includes(:time_interval).joins(:time_interval)
                                    .where(activity_id: activity.id, time_intervals: { start: d, end: (d + duration) })
                                    .lock('FOR UPDATE')
                                    .any?

            # puts "Réplication à la date du #{target_date} de la séance ##{inst_to_dup.id}"
            # pp inst_to_dup

            # si la séance de cours n'existe pas, on la crée
            time_interval = TimeInterval.new(start: d, end: d + duration, kind: 'c', is_validated: true)

            new_instance = inst_to_dup.dup
            new_instance.time_interval = time_interval
            attendances_data = inst_to_dup.student_attendances.pluck(:user_id, :is_option)
            new_instance.student_attendances << attendances_data.map { |user_id, is_option| StudentAttendance.new(user_id: user_id, is_option: is_option) }

            teacher_id = inst_to_dup.teachers_activity_instances.pick(:user_id)
            new_instance.teachers_activity_instances.new(user_id: teacher_id, is_main: true) if teacher_id
            new_instance.save!

            activity.activity_instances << new_instance
            activity.save!(validate: false)

            User.find(teacher_id).planning.time_intervals << new_instance.time_interval if teacher_id
            User.find(student_ids).map(&:planning).each { |p| p.time_intervals << new_instance.time_interval }

            replicated_count += 1
          end

        end

        progress.increment
      end

      #report = MemoryProfiler.stop
      #report.pretty_print

      status[:step] = "Réplication terminée (#{replicated_count} séances répliquées)"
      status[:result] = "#{replicated_count} séances répliquées"
      replicated_count
    end


    private

    def setup(replicate_on_vac, ref_week_date, target_date_start, target_date_end)
      ref_week_date = Date.parse(ref_week_date) if ref_week_date.is_a? String
      raise ArgumentError, 'Invalid ref week date' unless ref_week_date.is_a? Date

      target_date_start = Date.parse(target_date_start) if target_date_start.is_a? String
      raise ArgumentError, 'Invalid target date start' unless target_date_start.is_a? Date

      target_date_end = Date.parse(target_date_end) if target_date_end.is_a? String
      raise ArgumentError, 'Invalid target date end' unless target_date_end.is_a? Date

      monday = ref_week_date.beginning_of_week
      @ref_dates = (monday..monday + 6.days).to_a

      @target_dates = []
      (target_date_start..target_date_end).each do |target_date|

        # on passe au suivant si c'est un jour de vacance
        next if !replicate_on_vac && Holiday.where({ date: target_date.to_date }).any?

        ref_date = get_ref_date_for(target_date)
        @target_dates << target_date if activity_instances_on(ref_date).any?
      end
    end

    def get_ref_date_for(target_date)
      @ref_dates[target_date.wday - 1]
    end

    def activity_instances_on(date)
      @activity_instances_cache ||= Hash.new do |h, d|
        h[d] = ActivityInstance
                 .includes(:time_interval)
                 .joins(:time_interval)
                 .where({ time_intervals: { start: (d.beginning_of_day)..(d.end_of_day) } })
      end

      @activity_instances_cache[date]
    end
  end
end
