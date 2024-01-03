class Parameters::EvaluationParametersController < ApplicationController
  def index

  end

  def list_levels
    query = EvaluationLevelRef.all

    params[:filtered].each do |filter|
      query = case filter[:id]
              when "id"
                query.where(id: filter[:value])
              when "value"
                query.where(value: filter[:value])
              when "can_continue"
                query.where(can_continue: filter[:value] == 'oui')
              else
                query.where("#{filter[:id]} ILIKE ?", "#{filter[:value]}%")
              end
    end

    respond_to do |format|
      format.json { render json: list_json(query, params) }
    end
  end

  private

  def list_json(query, params)
    sort_order = params[:sorted][:desc] ? :desc : :asc

    total = query.count

    query = query.order(params[:sorted][:id].to_sym => sort_order)
                 .page(params[:page] + 1)
                 .per(params[:pageSize])

    pages = query.total_pages

    status = query.as_json
    authorize! :read, status

    {
      status: status,
      pages: pages,
      total: total
    }
  end
end
