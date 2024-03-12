# frozen_string_literal: true

class ActivityRefPricingController < ApplicationController

  def index
    respond_to do |format|
      format.json do
        render json: ActivityRefPricing.all
      end
    end
  end

  def create
    if verify_inputs
      render json: { errors: ["Veuillez remplir tous les champs"] }, status: :unprocessable_entity
      return
    end

    to_season_value = params.dig(:toSeason, :value).presence || nil
    @activity_ref_pricings = ActivityRefPricing.new(activity_ref_id: params[:activity_ref_id], from_season_id: params[:fromSeason][:value], to_season_id: to_season_value, price: "#{params[:price]}".gsub(',', '.').to_f, pricing_category_id: params[:name][:value])
    from_season = Season.find(@activity_ref_pricings.from_season_id)
    to_season = Season.find(@activity_ref_pricings.to_season_id) unless @activity_ref_pricings.to_season_id.nil?
    activity_ref = ActivityRef.find(params[:activity_ref_id])

    unless to_season.nil?
      unless from_season.starts_before(to_season)
        render json: { errors: ["La période de début doit être inférieure à la période de fin"] }, status: :unprocessable_entity
        return
      end
    end

    activity_ref.activity_ref_pricing.where(pricing_category_id: params[:name][:value]).each do |activity_ref_pricing|
      if activity_ref_pricing.overlaps?(@activity_ref_pricings)
        render json: { errors: ["Les périodes se chevauchent"] }, status: :unprocessable_entity
        return
      end
    end

    @activity_ref_pricings.save!

    respond_to do |format|
      format.json do
        render json: @activity_ref_pricings.as_json
      end
    end
  end

  def update
    if verify_inputs
      render json: { errors: ["Veuillez remplir tous les champs"] }, status: :unprocessable_entity
      return
    end

    @activity_ref_pricing = ActivityRefPricing.find(params[:id])
    to_season_value = params.dig(:toSeason, :value).presence || nil
    activity_ref = @activity_ref_pricing.activity_ref
    from_season = Season.find(params[:fromSeason][:value])
    to_season = Season.find(to_season_value) unless to_season_value.nil?

    unless to_season_value.nil?
      unless from_season.starts_before(to_season)
        render json: { errors: ["La période de début doit être inférieure à la période de fin"] }, status: :unprocessable_entity
        return
      end
    end

    if @activity_ref_pricing.from_season_id != params[:fromSeason][:value].to_i
      activity_ref.activity_ref_pricing.where(pricing_category_id: params[:name][:value]).each do |activity_ref_pricing|
        if activity_ref_pricing.overlaps?(@activity_ref_pricing)
          render json: { errors: ["Les périodes se chevauchent"] }, status: :unprocessable_entity
          return
        end
      end
    end

    @activity_ref_pricing.price = "#{params[:price]}".gsub(',', '.').to_f

    @activity_ref_pricing.save!

    respond_to do |format|
      format.json do
        render json: @activity_ref_pricing.as_json
      end
    end
  end

  def destroy
    @activity_ref_pricings = ActivityRefPricing.find(params[:id])
    @activity_ref_pricings.destroy!

    respond_to do |format|
      format.json do
        render status: :ok, json: {}
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
          data: query.as_json(include:
                                { pricing_category: {} }
                              ),
          pages: pages = query.total_pages,
          total: query.count
        }
      end
    end
  end

  def get_seasons_and_pricing_categories
    respond_to do |format|
      format.json {
        render json: {
          seasons: Season.all_seasons_cached.as_json(only: [:id, :label]),
          pricing_categories: PricingCategory.all.as_json,
          activity_ref_pricings: ActivityRefPricing.all.as_json(include: { pricing_category: {} }),
          packs: Pack.all.as_json(only: [:id, :user_id, :activity_ref_pricing_id])
        }
      }
    end
  end

  private

  def get_query_from_params(json_query = params)
    query = ActivityRefPricing.where(activity_ref_id: json_query[:activity_ref_id])

    json_query[:filtered].each do |filter|
      query = case filter[:id]
              when "id"
                query.where(id: filter[:value])
              else
                query
              end
    end

    query
  end

  def pricing_category_already_used?(pricing_category, activity_ref_id)
    ActivityRefPricing.where(activity_ref_id: activity_ref_id, pricing_category_id: pricing_category.id).count > 0
  end

  def verify_inputs
    params[:name].nil? || params[:fromSeason].nil?
  end

end
