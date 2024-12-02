class FormulesController < ApplicationController

  def index
    @formules = Formule.all

    authorize! :manage, @formules

    respond_to do |format|
      format.html
      format.json { render json: list }
    end
  end

  def create
    formule_params = params.permit(:name, :description, :number_of_items)
    formule = Formule.new(formule_params)

    authorize! :create, @formules

    ActiveRecord::Base.transaction do
      # Save formule items
      formule_items_params = params.permit(formuleItems: [:itemId, :isFamily])[:formuleItems]
      formule_items_params.each do |formule_item|
        formule.formule_items.new(
          item_type: formule_item[:isFamily] ? ActivityRefKind.class.name : Activity.class.name,
          item_id: formule_item[:itemId]
        )
      end

      # Save formule prices
      formule_prices_params = params.permit(formulePrices: [:priceCategoryId, :price, :fromSeasonId, :toSeasonId])[:formulePrices]
      formule_prices_params.each do |formule_price|
        to_season = Season.find_by(id: formule_price[:toSeasonId])
        from_season = Season.find(formule_price[:fromSeasonId])
        pricing_category = PricingCategory.find(formule_price[:priceCategoryId])

        formule.formule_pricings.new(
          pricing_category_id: pricing_category.id,
          price: formule_price[:price],
          from_season_id: from_season.id,
          to_season_id: to_season&.id
        )
      end

      if formule.save
        render json: formule.as_json
      else
        render json: { errors: formule.errors.full_messages }, status: 422
        raise ActiveRecord::Rollback
      end
    end
  end

  def update
    # @type [Formule]
    formule = Formule.find(params[:id])

    authorize! :edit, @formules

    formule_params = params.permit(:name, :description, :number_of_items)

    ActiveRecord::Base.transaction do
      # Save formule items
      formule_items_params = params.permit(formuleItems: [:itemId, :isFamily])[:formuleItems]

      formule.formule_items.destroy_all
      formule_items_params.each do |formule_item|
        formule.formule_items.new(
          item_type: formule_item[:isFamily] ? ActivityRefKind.class.name : Activity.class.name,
          item_id: formule_item[:itemId]
        )
      end

      # Save formule prices
      formule.formule_pricings.destroy_all

      formule_prices_params = params.permit(formulePrices: [:priceCategoryId, :price, :fromSeasonId, :toSeasonId])[:formulePrices]
      formule_prices_params.each do |formule_price|
        to_season = Season.find_by(id: formule_price[:toSeasonId])
        from_season = Season.find(formule_price[:fromSeasonId])
        pricing_category = PricingCategory.find(formule_price[:priceCategoryId])

        formule.formule_pricings.new(
          pricing_category_id: pricing_category.id,
          price: formule_price[:price],
          from_season_id: from_season.id,
          to_season_id: to_season&.id
        )
      end

      if formule.update(formule_params)
        render json: formule.as_json
      else
        render json: { errors: formule.errors.full_messages }, status: 422
        raise ActiveRecord::Rollback
      end
    end
  end

  private

  def list
    query = @formules

    filtered = JSON.parse(params[:filtered]&.to_s || "[]") || []

    filtered.each do |filter|
      case filter[:id]
      when "activities"
        query = query.joins(:activity_refs).joins(:activity_ref_kinds).where("activity_refs.id = ? OR activity_ref_kinds.id = ?", filter[:value], filter[:value])
      else
        query = query.where("#{filter[:id]} ILIKE ?", "#{filter[:value]}%")
      end
    end

    sorted = JSON.parse(params[:sorted]&.to_s || "{}") || nil

    if sorted
      sort_order = sorted[:desc] ? :desc : :asc
      query = query.order(sorted[:id].to_sym => sort_order)
    end

    total = query.count

    query = query
              .page((params[:page]&.to_i || 0))
              .per(params[:pageSize])

    pages = query.total_pages

    @formules = query.as_json(include: {
      activities: {
        only: %i[id display_name]
      }
    })
    authorize! :read, @formules

    {
      data: @formules,
      pages: pages,
      total: total
    }
  end
end

