class Parameters::PaymentsParametersController < ApplicationController

  def index

  end

  def list_payments_status
    query = PaymentStatus.all

    params[:filtered].each do |filter|
      query = case filter[:id]
              when "id"
                query.where(id: filter[:value])
              else
                query.where("#{filter[:id]} ILIKE ?", "#{filter[:value]}%")
              end
    end

    respond_to do |format|
      format.json { render json: list_json(query, params) }
    end
  end

  def list_payments_methods
    query = PaymentMethod.all

    params[:filtered].each do |filter|
      query = case filter[:id]
              when "id"
                query.where(id: filter[:value])
              when "is_special"
                query.where(is_special: filter[:value].downcase == "oui")
              when "is_credit_note"
                query.where(is_credit_note: filter[:value].downcase == "oui")
              else
                query.where("#{filter[:id]} ILIKE ?", "#{filter[:value]}%")
              end
    end

    respond_to do |format|
      format.json { render json: list_json(query, params) }
    end
  end

  def show_adhesion
    adhesion_enabled = Adhesion.enabled

    respond_to do |format|
      format.json { render json: { adhesion_enabled: adhesion_enabled, seasons: Season.all.as_json } }
    end
  end

  def update_adhesion
    value = params[:adhesion][:adhesion_enabled]
    adhesion_enabled = Parameter.find_or_create_by(label: "adhesion.enabled", value_type: "boolean")
    adhesion_enabled.value = value.to_s
    res = adhesion_enabled.save

    respond_to do |format|
      format.json {
        if res
          render status: :ok, json: {}
        else
          render status: :unprocessable_entity, json: { errors: { adhesionFee: "doit être un nombre positif" } }
        end
      }
    end
  end

  private

  def to_positive_float(value)
    begin
      res = Float(value)
    rescue ArgumentError
      return false
    end
    return res >= 0 ? res : false
  end

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
