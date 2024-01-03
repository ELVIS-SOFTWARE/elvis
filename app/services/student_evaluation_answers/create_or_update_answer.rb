module StudentEvaluationAnswers
    class CreateOrUpdateAnswer
        def initialize(evaluation, question, value)
            @evaluation = evaluation
            @question = question
            @value = value
        end

        def execute
            # Create or update level for student with given eval ref
            # IF THERE IS MORE PROCESSING TO DO, PLEASE MOVE
            # THIS CODE TO A STANDALONE SERVICE, TO AVOID
            # SERVICE CLUTTERING
            if @question.is_level_assignment
                evaluation_level_ref = EvaluationLevelRef.find(@value)

                level = @evaluation.student.levels.find_or_create_by!(
                    activity_ref_id: @evaluation.activity.activity_ref_id,
                    season_id: @evaluation.activity.season&.next&.id,
                )

                level.update(evaluation_level_ref: evaluation_level_ref)
            end

            answer = Answer.find_or_create_by!(
                answerable: @evaluation,
                question: @question,
            )

            answer.update(value: @value)
        end
    end
end