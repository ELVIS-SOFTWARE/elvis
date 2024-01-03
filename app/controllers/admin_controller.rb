class AdminController < ApplicationController

  def update_logo
    school = School.first

    school = School.create if school.nil?

    school.logo.attach(params[:picture])
    school.save!

    redirect_back(fallback_location: root_path)
  end

  def get_session_hour
    #getinterval_step
    evaluation_interval = Parameter.get_value("INTERVAL_STEPS")
    render json: { session_hour: evaluation_interval }
  end

  def update_session_hour
    # save interval_step

    school_params = params

    evaluation_interval = Parameter.find_or_create_by(label: "INTERVAL_STEPS", value_type: "json")
    interval_steps = { e: school_params["sessionHour"]&.to_i }
    evaluation_interval.value = interval_steps.to_json
    evaluation_interval.save

    render json: { session_hour: interval_steps }
  end

  def error_history
    @current_user = current_user

    authorize! :manage, ErrorHistory

    respond_to do |format|
      format.html { render "errors/history" }

      format.json do
        @error_histories = ErrorHistory.all.order(created_at: :desc).limit(20)

        render json: @error_histories.as_json(include: { error_code: { only: %i[user_message code] } })
      end
    end
  end
end
