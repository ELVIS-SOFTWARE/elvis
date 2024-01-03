class NewStudentLevelQuestionnairesController < ApplicationController
    def find
        @new_student_level_questionnaire = NewStudentLevelQuestionnaire
            .includes(:answers)
            .find_by(find_params)
            .as_json(include: :answers)

        render :json => {
            new_student_level_questionnaire: @new_student_level_questionnaire,
            reference_data: {},
        }
    end

    def find_by_appointment
        eval_app = EvaluationAppointment.find(params[:id])
        @new_student_level_questionnaire = NewStudentLevelQuestionnaire
            .includes(:answers)
            .find_by({ season: eval_app.season, activity_ref: eval_app.activity_ref, user: eval_app.student })
            .as_json(include: :answers)

        render :json => {
            questions: Question.new_student_level_questionnaire,
            new_student_level_questionnaire: @new_student_level_questionnaire,
            reference_data: {},
        }
    end

    private
    def find_params
        params.permit(:user_id, :activity_ref_id, :season_id)
    end
end