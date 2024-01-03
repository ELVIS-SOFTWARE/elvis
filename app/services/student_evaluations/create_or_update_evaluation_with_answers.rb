module StudentEvaluations
    class CreateOrUpdateEvaluationWithAnswers
        def initialize(teacher, student, activity, season, answers=nil)
            @teacher = teacher
            @student = student
            @activity = activity
            @season = season
            @answers = answers
        end

        def execute
            StudentEvaluation.transaction do
                @evaluation = StudentEvaluation.find_or_create_by!(
                    student: @student,
                    activity: @activity,
                    season: @season,
                    teacher: @teacher,
                )

                # Delete previous answers if we do not supply the question id
                Answer.where(answerable: @evaluation).where.not(question_id: @answers.keys).destroy_all

                @answers.each do |id, val|
                    question = Question.student_evaluation_questions.find(id)
                
                    StudentEvaluationAnswers::CreateOrUpdateAnswer
                        .new(@evaluation, question, val)
                        .execute
                end

                return @evaluation
            end
        end
    end
end