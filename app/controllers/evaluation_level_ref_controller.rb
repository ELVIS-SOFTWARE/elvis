class EvaluationLevelRefController < ApplicationController
  load_and_authorize_resource param_method: :evaluation_level_params

  def temp_to_new_level_management_system
    applications = ActivityApplication.all
    applications.each do |application|
      unless application.user.evaluation_level_ref_id.nil?
        evaluation_level_ref_id = application.user.evaluation_level_ref_id
        user_id = application.user.id

        user_activity_ref_ids = Array.new
        application.desired_activities.each do |da|
          unless user_activity_ref_ids.include?(da.activity_ref_id)
            user_activity_ref_ids.push(da.activity_ref_id)
          end
          #Level.create(activity_ref_id: activity_ref_id, evaluation_level_ref_id: evaluation_level_ref_id, user_id: user_id)
        end
        user_activity_ref_ids.each do |activity_ref_id|
          Level.create(activity_ref_id: activity_ref_id, evaluation_level_ref_id: evaluation_level_ref_id, user_id: user_id)
        end
      end
    end
  end

  def index
  end

  def show
  end

  def new
  end

  def create
    level = EvaluationLevelRef.new(evaluation_level_params)

    level.save

    redirect_to "#{parameters_evaluations_parameters_path}#tab-0"
  end

  def edit
  end

  def update
    level = EvaluationLevelRef.find(params[:id])

    if level.update(evaluation_level_params)
      redirect_to "#{parameters_evaluations_parameters_path}#tab-0"
    else
      redirect_to users_path
    end
  end

  def destroy
    level = EvaluationLevelRef.find(params[:id])

    level&.destroy!

    respond_to do |format|
      format.html { redirect_to evaluation_level_ref_index_path }
      format.json { render json: level, status: :ok }
    end
  end

  private

  def evaluation_level_params
    params.require(:evaluation_level_ref).permit(:value, :label)
  end
end
