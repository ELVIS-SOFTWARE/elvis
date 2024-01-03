module StudentEvaluations
  module Stats
    class CalculateStats
      def initialize(teachers, season, next_season)
        @teachers = teachers
        @season = season
        @next_season = next_season
      end

      def execute
        should_change_activity_question = Question
                                          .student_evaluation_questions
                                          .find_by(name: "should_change_activity")

        informed_in_due_time_of_change_question = Question
                                                  .student_evaluation_questions
                                                  .find_by(name: "informed_in_due_time_of_change")

        # There are three indicators to calculate per teacher:
        # - The evaluations completion rate
        # (The number of evaluations filled out of all the evaluations which can be filled)
        # - The number of group changes advised
        # - The number of students informed of the group change
        # if any was advised (should be less or equal compared to the second indicator)
        @teachers.order(:last_name).map do |teacher|
          season_activities_query = teacher.season_teacher_activities(@season)
                                     .includes(:students)
                                     .includes(:activity_ref)
                                     .includes(activity_ref: :activity_ref_kind)

          season_activities = season_activities_query
                                .where.not(activity_refs: { activity_type: %w[child cham]})
                                .or(season_activities_query.where(activity_refs: { activity_type: nil})) # where.not with tab remove the null values by default, so we have to add them back

          #  .season_teacher_activities(@season)
          #  .includes(:students)
          #  .joins(:activity_ref => :activity_ref_kind)
          #  .includes(:activity_ref_kind)
          #  .where.not(activity_refs: { activity_ref_kinds: { name: ["Enfance", "CHAM"] } })

          students_act_pairs = season_activities
                               .map { |a| a.students.map { |s| "(#{a.id}, #{s.user_id})" } }
                               .flatten
                               .uniq

          nb_students = students_act_pairs.count

          next if nb_students == 0

          # Had to form the raw SQL myself because rails
          # was flattening the pairs array I was giving it
          # so I had the construct the SQL query myself
          nb_evaluated_students = StudentEvaluation
                                  .where(season: @next_season)
                                  .where("(activity_id, student_id) IN (#{students_act_pairs.join(', ')})")
                                  .count

          evaluations_completion_rate = (100 * (nb_evaluated_students.to_f / nb_students.to_f)).to_i

          evaluations_completion_rate_level = case evaluations_completion_rate
                                              when 0..20
                                                "danger"
                                              when 20..70
                                                "warning"
                                              when 70..100
                                                "info"
                                              end

          redirections_evaluations_ids = StudentEvaluation
                                         .joins(:answers)
                                         .where({
                                                  teacher: teacher,
                                                  answers: {
                                                    question: should_change_activity_question,
                                                    value: %w[advised mandatory]
                                                  }
                                                })
                                         .ids

          nb_redirections = redirections_evaluations_ids.count

          nb_informed_redirections = StudentEvaluation
                                     .joins(:answers)
                                     .where({
                                              id: redirections_evaluations_ids,
                                              answers: {
                                                question: informed_in_due_time_of_change_question,
                                                value: "true"
                                              }
                                            })
                                     .count

          redirection_information_rate = 100 * (nb_informed_redirections.to_f / nb_redirections.to_f)

          redirection_information_rate = 100 if redirection_information_rate.nan?

          redirection_information_rate = redirection_information_rate.to_i

          redirection_information_rate_level = case redirection_information_rate
                                               when 0..20
                                                 "danger"
                                               when 20..70
                                                 "warning"
                                               when 70..100
                                                 "info"
                                               end

          {
            teacher: teacher,
            nb_students: nb_students,
            nb_evaluated_students: nb_evaluated_students,
            evaluations_completion_rate: evaluations_completion_rate,
            evaluations_completion_rate_level: evaluations_completion_rate_level,
            nb_redirections: nb_redirections,
            nb_informed_redirections: nb_informed_redirections,
            redirection_information_rate: redirection_information_rate,
            redirection_information_rate_level: redirection_information_rate_level
          }
        end
                 .compact
      end
    end
  end
end
