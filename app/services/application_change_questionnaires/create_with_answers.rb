module ApplicationChangeQuestionnaires
    class CreateWithAnswers
        def initialize(user, activity, season, answers)
            @user = user
            @activity = activity
            @season = season
            @answers = answers
        end

        def execute
            ApplicationChangeQuestionnaire.transaction do
                @questionnaire = ApplicationChangeQuestionnaire.find_or_create_by!(
                    user: @user,
                    activity: @activity,
                    season: @season,
                )

                @answers.each do |id, val|
                    question = Question.application_change_questionnaire.find(id)
                    
                    Answer.create!(
                        answerable: @questionnaire,
                        question: question,
                        value: val,
                    )
                end

                return @evaluation
            end
        end
    end
end