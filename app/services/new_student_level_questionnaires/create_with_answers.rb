module NewStudentLevelQuestionnaires
  class CreateWithAnswers
    def initialize(user, activity_ref, season, answers)
      @user = user
      @activity_ref = activity_ref
      @season = season
      @answers = answers
    end

    def execute
      NewStudentLevelQuestionnaire.transaction do
        @evaluation = NewStudentLevelQuestionnaire.find_or_create_by!(
          user: @user,
          activity_ref: @activity_ref,
          season: @season,
        )

        already_practiced_instrument = Question.new_student_level_questionnaire.find_by(name: "already_practiced_instrument")

        @answers.each do |id, val|
          question = Question.new_student_level_questionnaire.find(id)

          # Create beginner level if user has never practiced the instrument
          if question == already_practiced_instrument && val == "false"
            beginner_level_ref = EvaluationLevelRef.where(label: "DEBUTANT").first
            @user.levels.find_or_create_by!(
              season: @season,
              activity_ref: @activity_ref,
              evaluation_level_ref: beginner_level_ref,
            ) if beginner_level_ref
          else # Remove beginner level if user has practiced the instrument
            @user.levels.find_by(
              season: @season,
              activity_ref: @activity_ref,
            )&.destroy
          end

          Answer.create!(
            answerable: @evaluation,
            question: question,
            value: val,
          )
        end

        return @evaluation
      end
    end
  end
end