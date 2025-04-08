# frozen_string_literal: true

class FormulePricingsController < ApplicationController
  def list
    formule = Formule.find(params[:formule_id])

    authorize! :manage, formule

    query = formule.formule_pricings

    total = query.count

    query = query
              .page((params[:page]&.to_i || 0))
              .per(params[:pageSize])

    pages = query.total_pages

    render json: {
      data: query.as_json(
        include: {
          pricing_category: {
            only: %i[id name]
          },
          from_season: {
            only: %i[id name]
          },
          to_season: {
            only: %i[id name]
          }
        }
      ),
      pages: pages,
      total: total
    }
  end

  def create
    formule = Formule.find(params[:formule_id])

    authorize! :manage, formule

    formule_price_params = self.formule_price_params

    formule_price = params[:price]

    from_season = Season.find(formule_price_params.dig(:fromSeason, :value))
    to_season = Season.find(formule_price_params.dig(:fromSeason, :value)) if formule_price_params.dig(:toSeason, :value).present?

    pricing_category = PricingCategory.find(formule_price_params.dig(:name, :value))

    formule.formule_pricings.new(
      pricing_category_id: pricing_category.id,
      price: "#{formule_price}".to_i,
      from_season_id: from_season.id,
      to_season_id: to_season&.id
    )

    ActiveRecord::Base.transaction do
      if formule.save
        render json: formule.as_json
      else
        render json: { errors: formule.errors.full_messages }, status: 422
        raise ActiveRecord::Rollback
      end
    end
  end

  def update
    formule = Formule.find(params[:formule_id])
    formule_price = formule.formule_pricings.find(params[:id])

    authorize! :manage, formule

    formule_price_params = self.formule_price_params

    from_season = Season.find(formule_price_params.dig(:fromSeason, :value))
    to_season = Season.find(formule_price_params.dig(:fromSeason, :value)) if formule_price_params.dig(:toSeason, :value).present?

    pricing_category = PricingCategory.find(formule_price_params.dig(:name, :value))

    formule_price.update(
      pricing_category_id: pricing_category.id,
      price: "#{params[:price]}".to_i,
      from_season_id: from_season.id,
      to_season_id: to_season&.id
    )

    ActiveRecord::Base.transaction do
      if formule.save
        render json: formule.as_json
      else
        render json: { errors: formule.errors.full_messages }, status: 422
        raise ActiveRecord::Rollback
      end
    end
  end

  def destroy
    formule = Formule.find(params[:formule_id])
    formule_price = formule.formule_pricings.find(params[:id])

    authorize! :manage, formule

    formule_price.destroy

    render json: formule.as_json
  end

  private

  def formule_price_params
    params.permit(:price, fromSeason: [:value], toSeason: [:value], name: [:value])
  end
end
