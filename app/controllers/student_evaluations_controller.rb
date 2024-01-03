class StudentEvaluationsController < ApplicationController
    def create
        teacher = User.find(params[:teacher_id])
        student = User.find(params[:student_id])
        activity = Activity.find(params[:activity_id])
        season = Season.find(params[:season_id])

        evaluation = StudentEvaluations::CreateOrUpdateEvaluationWithAnswers.new(
                teacher,
                student,
                activity,
                season,
                params[:answers],
            ).execute

        test = evaluation.as_json({
            :include => :answers,
        })
        render :json => {
            evaluation: evaluation.as_json({
                :include => :answers,
            }),
            student: { 
                id: student.id,
                levels: student.levels.as_json({
                    :include => [:evaluation_level_ref, :activity_ref]
                }) 
            }
        }
    end

    def get
        student_evaluation = StudentEvaluation.find(params[:id])

        @student_evaluation = student_evaluation.as_json(include: :answers)

        activities = student_evaluation.teacher.season_teacher_activities(Season.current)
        @activities = activities.as_json(include: :users)

        @reference_data = {
            evaluation_level_refs: EvaluationLevelRef.all,
            activities: @activities,
        }.as_json

        render :json => {
            student_evaluation: @student_evaluation,
            reference_data: @reference_data,
        }
    end
end