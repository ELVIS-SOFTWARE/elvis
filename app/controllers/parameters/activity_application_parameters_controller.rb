class Parameters::ActivityApplicationParametersController < ApplicationController
  def index

  end

  def list_status
    query = ActivityApplicationStatus.all

    params[:filtered].each do |filter|
      query = case filter[:id]
              when "id"
                query.where(id: filter[:value])
              else
                query.where("#{filter[:id]} ILIKE ?", "#{filter[:value]}%")
              end
    end

    respond_to do |format|
      format.json { render json: status_list_json(query, params) }
    end
  end

  def get_application_step_parameters
    @activated = Parameter.get_value('activity_choice_step.activated')
    @display_text = Parameter.get_value('activity_choice_step.display_text')

    respond_to do |format|
      format.json { render json: {
        activated: @activated.present?,
        display_text: @display_text
      }, status: :ok }
    end

  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def change_activated_param
    @activated = Parameter.find_or_create_by(label: 'activity_choice_step.activated')
    @activated.update!(value: params[:activated].to_s)

    respond_to do |format|
      format.json { render json: { activated: params[:activated] }, status: :ok }
    end

  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def change_display_text_param
    @display_text = Parameter.find_or_create_by(label: 'activity_choice_step.display_text')
    @display_text.update!(value: params[:display_text])

  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def status_list_json(query, params)
    sort_order = params[:sorted][:desc] ? :desc : :asc

    total = query.count

    query = query.order(params[:sorted][:id].to_sym => sort_order)
                 .page(params[:page] + 1)
                 .per(params[:pageSize])

    pages = query.total_pages

    status = query.as_json(methods: [:built_in])
    authorize! :read, status

    {
      status: status,
      pages: pages,
      total: total
    }
  end
end
