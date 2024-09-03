# frozen_string_literal: true

module ActivityApplications
  class FindActivitySuggestions
    def initialize(desired_activity_id, do_format = true, mode = "CUSTOM")
      @desired_activity_id = desired_activity_id
      @do_format = do_format
      @mode = mode
    end

    def execute
      desired_activity = nil
      matches = nil

      case @mode
      when "ALL"
        desired_activity = DesiredActivity.includes({
                                                      activity_application: :season,
                                                      activity_ref: { activity_ref_kind: {} }
                                                    }).find(@desired_activity_id)
        matches = Elvis::CacheUtils.cache_block_if_enabled("find_all_suggestions_#{desired_activity.id}") do
          self.find_all_suggestions(desired_activity)
        end
      when "CUSTOM"
        desired_activity = DesiredActivity.includes({
                                                      activity_application: {
                                                        season: {},
                                                        desired_activities: { activity: { activity_ref: [:activity_ref_kind] } },
                                                        user: [:levels, { planning: :time_intervals }]
                                                      },
                                                      options: {},
                                                      activity_ref: [:activity_ref_kind],
                                                      activity: { time_interval: {}, activity_ref: [:activity_ref_kind] }
                                                    }).find(@desired_activity_id)
        matches = Elvis::CacheUtils.cache_block_if_enabled("find_custom_suggestions_#{desired_activity.id}") do
          self.find_custom_suggestions(desired_activity)
        end
      end

      desired_activity = desired_activity || DesiredActivity.find(@desired_activity_id)

      application = desired_activity.activity_application

      matches = matches&.to_a || []

      # return with or without active/inactive students
      !@do_format ?
        matches :
        matches.map do |activity|
          from_date = application.stopped_at ? Time.zone.now : application.begin_at

          Elvis::CacheUtils.cache_block_if_enabled("format_for_suggestion_u:#{application.user_id}_a:#{activity.id}_fd:#{from_date.to_date}") do
            Utils.format_for_suggestion(application.user, activity, from_date)
          end
        end
    end

    # @param [DesiredActivity] desired_activity
    def find_all_suggestions(desired_activity)
      activity_ref = desired_activity.activity_ref
      season = desired_activity.activity_application.season

      matches = Activity
                  .includes({
                              time_interval: {},
                              activity_ref: { activity_ref_kind: {} },
                              users: {},
                            })
                  .where({
                           time_intervals: {
                             start: season.start..season.end,
                           },
                         })

      if activity_ref.activity_type&.to_s == "child"
        matches = matches.where({ activity_ref_id: activity_ref.id })
      else
        matches = matches
                    .where({
                             activity_refs: {
                               activity_ref_kind_id: activity_ref.activity_ref_kind_id,
                             },
                           })
      end

      matches
    end

    # @param [DesiredActivity] desired_activity
    def find_custom_suggestions(desired_activity)
      # @type [ActivityRef]
      activity_ref = ActivityRef.includes(:activity_ref_kind).find(desired_activity.activity_ref_id)
      # @type [ActivityApplication]
      application = desired_activity.activity_application
      # @type [Season]
      application_season = application.season
      # @type [User]
      user = application.user

      availability_intervals = []

      is_childhood = false
      skip_intervals_matching = false

      matches = []

      if %w[child chorale_ma].include? desired_activity.activity_ref.activity_type&.to_s
        is_childhood = true

        # si l'élève n'a sélectionné aucun créneau
        # on considère que tous les créneaux lui conviennent :-D
        if user.time_interval_preferences.where(season: application_season).none?
          skip_intervals_matching = true
          matches = TimeInterval
                      .validated
                      .joins({ activity: { activity_ref: :activity_ref_kind } })
                      .where({
                               start: (application_season.start..application_season.end),
                               activities: {
                                 activity_ref: activity_ref
                               }
                             }).to_a
        end
      end

      # On récupère les disponibilités renseignées par l'utilisateur et on fusionne ceux qui sont adjacents
      # NB : pour les activités qui proposent des créneaux, les intervalles sont renvoyés ordonnés par préférence (le préféré d'abord)
      availability_intervals = TimeInterval.merge_sticked application.availabilities(include_validated: true)

      unless skip_intervals_matching
        user_activity_application_ids = ActivityApplication
                                          .where(user_id: application.user_id)
                                          .pluck(:id)

        busy_interval_ids = DesiredActivity
          .joins(:activity)
          .where(activity_application_id: user_activity_application_ids, is_validated: true)
          .where.not(id: desired_activity.id)
          .pluck(:time_interval_id)
          .uniq

        busy_intervals = TimeInterval.where(id: busy_interval_ids).to_a

          #busy_intervals = ActivityApplication
          #                 .where(user_id: application.user_id)
          #                 .map(&:desired_activities)
          #                 .flatten
          #                 .compact
          #                 .select(&:is_validated)
          #                 .select(&:activity) - [desired_activity]

        #  On itère sur chaque time_pref pour trouver les matchs possibles parmi tous les créneaux validés
        availability_intervals.each do |time_pref|
          # Il nous faut désormais filtrer les créneaux pour ne garder que ceux dont le niveau correspond
          matches << time_pref.matching_intervals(
            activity_ref,
            busy_intervals,
            application_season
          )
        end

        matches.flatten!
        matches.uniq!
      end

      activities = Activity
        .includes({
                    evaluation_level_ref: {},
                    teachers_activities: {},
                    options: {
                      desired_activity: {
                        activity_application: [:user]
                      }
                    },
                    location: {},
                    room: {},
                    time_interval: [:time_interval_preferences],
                    activity_ref: [:activity_ref_kind],
                    activities_instruments: [:user],
                    users: {},
                    activity_instances: {}
                  })
        .where(time_interval_id: matches.map(&:id))
        .to_a

      activities.select! do |a|
        instance = a.closest_instance(application.begin_at)

        if instance
          students_count = instance.active_students.count

          (students_count <= a.activity_ref.occupation_limit &&
            students_count <= a.activity_ref.occupation_hard_limit) ||
            a.user_ids.include?(application.user_id)
        else
          false
        end
      end

      # sort
      unless is_childhood
        activities.sort_by! { |a| a.users.count }.reverse!

        activities = sort_by_teacher_prev(activities, application)
        activities = sort_by_day_prev(activities, application)
      end

      (activities + [desired_activity.activity]).uniq!
    end

    def sort_by_teacher_prev(suggestions, application)
      prev_teacher = application&.pre_application_activity&.activity&.teachers&.first

      if suggestions.empty? || prev_teacher.nil?
        return suggestions
      else
        ordered_results = suggestions.sort_by do |s|
          (s.is_a?(Activity) ? s : s.activity).teacher.id == prev_teacher.id ? -1 : 0
        end

        return ordered_results
      end
    end

    def sort_by_day_prev(suggestions, application)
      prev_day = application&.pre_application_activity&.activity&.time_interval&.start&.strftime("%A")

      if suggestions.empty? || prev_day.nil?
        return suggestions
      else
        ordered_results = suggestions.sort_by do |s|
          (s.is_a?(Activity) ? s : s.activity).time_interval.start.strftime("%A") == prev_day ? -1 : 0
        end

        return ordered_results
      end
    end
  end
end
