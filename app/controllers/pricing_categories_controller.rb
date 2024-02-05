# frozen_string_literal: true

class PricingCategoriesController < ApplicationController

  def index
    @pricing_categories = PricingCategory.all

    respond_to do |format|
      format.json { render json: @pricing_categories.as_json }
    end
  end

  def create
    is_pack = params[:is_a_pack].present? ? true : false
    @pricing_category = PricingCategory.new(name: params[:name], number_lessons: params[:number_lessons], is_a_pack: is_pack)
    res = @pricing_category.save

    respond_to do |format|
      format.json do
        render json: @pricing_category.as_json and return if res
        render status: :unprocessable_entity, json: { errors: @pricing_category.errors.full_messages }
      end
    end
  end

  def update
    @pricing_category = PricingCategory.find(params[:id])

    res = @pricing_category.update(name: params[:name], number_lessons: params[:number_lessons], is_a_pack: params[:is_a_pack])

    respond_to do |format|
      format.json do
        render json: @pricing_category.as_json and return @pricing_category if res
        render status: :unprocessable_entity, json: { errors: @pricing_category.errors.full_messages }
      end
    end
  end

  def destroy
    @pricing_category = PricingCategory.find(params[:id])

    begin
      @pricing_category.destroy!
      render status: :ok, json: {}
    rescue StandardError => e
      render status: :unprocessable_entity,
             json: { message: "Erreur lors de la suppression, la catégorie de prix est encore référencée" }
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
          data: query.as_json,
          pages: pages = query.total_pages,
          total: query.count
        }
      end
    end
  end

  private

  def get_query_from_params(json_query = params)
    query = PricingCategory.all

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

end
