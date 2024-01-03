# frozen_string_literal: true

class CouponsController < ApplicationController

  def index

    @coupons = Coupon.all

    respond_to do |format|
      format.json { render json: @coupons.as_json }
    end
  end

  def create
    @coupon = Coupon.new(coupon_create_params)
    res = @coupon.save

    respond_to do |format|
      format.json do
        render json: @coupon.as_json and return if res
        render status: :unprocessable_entity, json: { errors: @coupon.errors.full_messages }
      end
    end
  end

  # NB : on n'autorise pas la modification du pourcentage de réduction
  def update
    @coupon = Coupon.find(params[:id])

    res = @coupon.update(coupon_update_params)

    respond_to do |format|
      format.json do
        render json: @coupon.as_json and return @coupon if res
        render status: :unprocessable_entity, json: { errors: @coupon.errors.full_messages }
      end
    end
  end

  def destroy
    @coupon = Coupon.find(params[:id])

    res = @coupon.destroy

    respond_to do |format|
      format.json do
        render status: :ok, json: {} and return if res
        render status: :unprocessable_entity, json: { errors: @coupon.errors.full_messages }
      end
    end
  end

  def list
    query = get_query_from_params

    if params[:sorted]
      sort_order = params[:sorted][:desc] ? :desc : :asc
      query = query
                .order(params[:sorted][:id].to_sym => sort_order)
    end

    query = query
              .page(params[:page] + 1)
              .per(params[:pageSize])

    respond_to do |format|
      format.json do
        render json: {
          data: query.as_json(methods: :has_any_discount),
          pages: pages = query.total_pages,
          total: query.count
        }
      end
    end
  end

  private

  def get_query_from_params(json_query = params)
    query = Coupon.all

    json_query[:filtered].each do |filter|
      query = case filter[:id]
              when "id"
                query.where(id: filter[:value])
              else
                if filter[:value] != "all"
                  query.where("#{filter[:id]} ILIKE ?", "#{filter[:value]}%")
                end

              end
    end

    query
  end

  def coupon_create_params
    params
      .permit(:label, :percent_off)
      .merge(enabled: params.key?(:enabled))
  end

  def coupon_update_params
    params.permit(:label, :enabled)
  end
end

