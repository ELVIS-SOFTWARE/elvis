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
    @activated = Parameter.get_value('application_step_parameter.activated')
    @display_text = Parameter.get_value('application_step_parameter.display_text')

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
    @activated = Parameter.find_by(label: 'application_step_parameter.activated')

    if @activated.present?
      @activated.update!(value: params[:activated].to_s)
    else
      Parameter.create!(label: 'application_step_parameter.activated', value: params[:activated].to_s, value_type: "boolean")
    end

    respond_to do |format|
      format.json { render json: { activated: params[:activated] }, status: :ok }
    end

  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def change_display_text_param
    @display_text = Parameter.find_by(label: 'application_step_parameter.display_text')

    if @display_text.present?
      @display_text.update!(value: params[:display_text])
    else
      Parameter.create!(label: 'application_step_parameter.display_text', value: params[:display_text], value_type: "string")
    end

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
