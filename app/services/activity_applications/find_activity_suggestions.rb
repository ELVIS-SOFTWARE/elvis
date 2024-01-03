# frozen_string_literal: true

module ActivityApplications
  class FindActivitySuggestions
    def initialize(desired_activity_id, do_format = true, mode = "CUSTOM")
      @desired_activity_id = desired_activity_id
      @do_format = do_format
      @mode = mode
    end

    def execute
      desired_activity = DesiredActivity.includes(:activity_application).find(@desired_activity_id)
      application = desired_activity.activity_application

      matches = nil

      case @mode
      when "ALL"
        matches = self.find_all_suggestions
      when "CUSTOM"
        matches = self.find_custom_suggestions
      end

      # return with or without active/inactive students
      !@do_format ?
        matches :
        matches.map do |activity|
          Utils.format_for_suggestion(application.user, activity, application.stopped_at ? Time.zone.now : application.begin_at)
        end
    end

    def find_all_suggestions
      desired_activity = DesiredActivity.includes({
                                                    activity_application: :season,
                                                    activity_ref: { activity_ref_kind: {} }
                                                  }).find(@desired_activity_id)

      activity_ref = desired_activity.activity_ref
      season = desired_activity.activity_application.season

      matches = Activity
                  .includes({
                              evaluation_level_ref: {},
                              options: {
                                desired_activity: {
                                  activity_application: :user,
                                },
                              },
                              location: {},
                              room: {},
                              time_interval: {},
                              activity_ref: { activity_ref_kind: {} }
                            })
                  .where({
                           time_intervals: {
                             start: season.start..season.end,
                           },
                         })

      if activity_ref.activity_type == "child"
        matches = matches.where({ activity_ref_id: activity_ref.id })
      else
        matches = matches
                    .where({
                             activity_refs: {
                               activity_ref_kind_id: activity_ref.activity_ref_kind.id,
                             },
                           })
      end

      matches
    end

    def find_custom_suggestions
      # @type [DesiredActivity]
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

      if ["child", "chorale_ma"].include? desired_activity.activity_ref.activity_type
        is_childhood = true

        # si l'élève n'a sélectionné aucun créneau
        # on considère que tous les créneaux lui conviennent :-D
        if user.time_interval_preferences.where(season: application_season).none?
          skip_intervals_matching = true
          matches = TimeInterval
                      .validated
                      .joins({ activity: { activity_ref: :activity_ref_kind } })
                      .includes({ activity: { activity_ref: :activity_ref_kind } })
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
        busy_intervals = application
                           .user
                           .activity_applications
                           .map(&:desired_activities)
                           .flatten
                           .compact
                           .select(&:is_validated)
                           .select(&:activity) - [desired_activity]

        #  On itère sur chaque time_pref pour trouver les matchs possibles parmi tous les créneaux validés
        availability_intervals.each do |time_pref|
          # Il nous faut désormais filtrer les créneaux pour ne garder que ceux dont le niveau correspond
          matches << time_pref.matching_intervals(
            activity_ref,
            busy_intervals.map { |d| d.activity.time_interval }.compact,
            application_season
          )
        end

        matches.flatten!
        matches.uniq!
      end

      # Il faut pouvoir tout de même inclure les utilisateurs déjà ajouté au créneau
      matches.select! do |m|
        instance = m.activity.closest_instance(application.begin_at)

        if instance
          students_count = instance.active_students.count

          (students_count <= m.activity.activity_ref.occupation_limit &&
            students_count <= m.activity.activity_ref.occupation_hard_limit) ||
            m.activity.users.include?(application.user)
        else
          false
        end
      end

      unless is_childhood
        matches.sort_by! { |m| m.activity.users.length }.reverse!

        matches = sort_by_teacher_prev(matches, application)
        matches = sort_by_day_prev(matches, application)
      end


      matches = [desired_activity.activity&.time_interval].compact + matches

      matches.map(&:activity).uniq
    end

    def sort_by_teacher_prev(suggestions, application)
      prev_teacher = application&.pre_application_activity&.activity&.teachers&.first

      if suggestions.empty? || prev_teacher.nil?
        return suggestions
      else
        ordered_results = suggestions.sort_by do |s|
          s.activity.teacher.id == prev_teacher.id ? -1 : 0
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
          s.activity.time_interval.start.strftime("%A") == prev_day ? -1 : 0
        end

        return ordered_results
      end
    end
  end
end
