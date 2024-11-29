class FormulesController < ApplicationController

  def index
    @formules = Formule.all

    respond_to do |format|
      format.html
      format.json { render json: @formules.as_json }
    end
  end

  def create
    formule_params = params.permit(:name, :description, :number_of_items)
    formule = Formule.new(formule_params)

    if formule.save
      # Save formule items
      formule_items_params = params.permit(formuleItems: [:itemId, :isFamily])[:formuleItems]
      formule_items_params.each do |formule_item|

        if formule_item[:isFamily] == "true"
          formule_item[:type] = "ActivityRefKind"
        else
          formule_item[:type] = "ActivityRef"
        end

        formule_item = FormuleItem.new(
          item_id: formule_item[:itemId],
          item_type: formule_item[:type],
          formule_id: formule.id
        )

        if formule_item.save
          puts "Formule item saved: #{formule_item.inspect}"
        else
          puts "Error saving formule item: #{formule_item.errors.full_messages}"
        end
      end

      # Save formule prices
      formule_prices_params = params.permit(formulePrices: [:priceCategoryId, :price, :fromSeasonId, :toSeasonId])[:formulePrices]
      formule_prices_params.each do |formule_price|
        to_season = Season.find_by(id: formule_price[:toSeasonId])
        from_season = Season.find(formule_price[:fromSeasonId])
        pricing_category = PricingCategory.find(formule_price[:priceCategoryId])

        formule_pricing = FormulePricing.new(
          pricing_category_id: pricing_category.id,
          price: formule_price[:price],
          from_season_id: from_season.id,
          to_season_id: to_season&.id,
          formule_id: formule.id
        )

        if formule_pricing.save
          puts "Formule pricing saved: #{formule_pricing.inspect}"
        else
          puts "Error saving formule pricing: #{formule_pricing.errors.full_messages}"
        end
      end

      render json: formule.as_json
    else
      render json: { errors: formule.errors.full_messages }, status: 422
    end
  end



end

