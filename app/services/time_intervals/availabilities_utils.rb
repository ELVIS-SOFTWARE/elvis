module TimeIntervals


  # Permet de créer un intervalle de temps de type "disponibilité" dans un planning.
  # Si des conflits sont détectés, l'intervalle ne sera pas créé.
  # Si le paramètre INTERVAL_STEPS est défini, l'intervalle sera segmenté en plusieurs intervalles de taille égale
  # Paramètres :
  # - from : Date de début de l'intervalle
  # - to : Date de fin de l'intervalle
  # - season_id : ID de la saison (pour la vérification des conflits)
  # - planning_id : ID du planning dans lequel créer l'intervalle (planning d'un utilisateur)
  # - comment : Commentaire à ajouter à l'intervalle
  # Retourne : Tableau du (ou des) intervalle(s) créés())
  class AvailabilitiesUtils
        def initialize(from, to, season_id, planning_id, comment)
            @from = from
            @to = to
            @kind = 'p'
            @planning = Planning.includes(:time_intervals).find_by(id: planning_id)
            season = Season.find(season_id)
            day_start = season.start
            day_end = day_start + 7.day
            @potential_conflicts = @planning
                                     &.time_intervals
                                     &.where({ start: (day_start..day_end) }) || []
            @comment = comment
        end

        # if save_in_database is false, the comment will not be created
        private def create_objects!(save_in_database: true)
            # If specified interval is invalid, raise error
            # From time >= to time
            # OR From date != to date (inteval not on the same day)
            if @from.to_datetime >= @to.to_datetime || @from.to_date != @to.to_date
                raise IntervalError, "err_interval_bounds"
            end

            step_param = Parameter.find_by_label("INTERVAL_STEPS")
            steps = step_param.parse
            step = step_param.nil? || !steps.key?(@kind) ? 0 : steps[@kind] # Steps are expressed in minutes

            has_conflicts = false
            new_intervals = []
            TimeInterval.transaction do
                new_intervals = segment_interval(@from, @to, step).map{ |int|
                    existing_interval = TimeInterval.find_by(start: int[:start], end: int[:end], kind: @kind, is_validated: false)
                    next if existing_interval

                    interval = TimeInterval.new
                    interval.start = int[:start]
                    interval.end = int[:end]
                    interval.kind = @kind
                    interval.is_validated = false

                    if check_conflicts?(interval)
                        has_conflicts = true
                        nil
                    else
                        if save_in_database
                            interval.save!
                            interval.create_comment!(content: @comment.strip, user: @planning.user) unless @comment.blank?
                        else
                            interval.build_comment(content: @comment.strip, user: @planning.user) unless @comment.blank?
                        end

                        interval
                    end
                }
                                                                  .compact

                if new_intervals.length == 0 || has_conflicts
                    raise IntervalError, "err_interval_creation_failed"
                end
            end

            new_intervals
        end

        def bulk_create
            new_intervals = create_objects!

            @planning.time_intervals << new_intervals
            @planning.save!

            new_intervals
        end

        # Check if the interval can be created
        # Returns [true, [created_intervals], nil] if the interval can be created
        # Returns [false, [], IntervalError] if the interval cannot be created
        def can_create?
            [true, create_objects!(save_in_database: false), nil]
        rescue IntervalError => e
            [false, [], e]
        end

        private


        def segment_interval(from, to, step)
            intervals = []

            from_time = from.to_datetime
            to_time = to.to_datetime

            if step == 0
                intervals << { start: from_time, end: to_time }
            elsif (interval_count = ((to_time - from_time) * 1.day.in_minutes.to_i / step).to_f.floor - 1)

                for i in 0..interval_count
                    start_date = from_time + (i * step).minutes
                    end_date = start_date + step.minutes

                    intervals << { start: start_date, end: end_date }
                end
            end

            intervals
        end

        def check_conflicts?(interval)
            @potential_conflicts.each do |pc|
                if interval.kind == "p" && pc.kind == "p" && pc.overlap_in_any_way?(interval)
                    return true
                elsif interval.kind != "p" && pc.kind != "p" && pc.overlap_in_any_way?(interval)
                    return true
                end
            end

            return false
        end
    end
end