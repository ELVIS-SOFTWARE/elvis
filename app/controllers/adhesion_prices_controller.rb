class AdhesionPricesController < ApplicationController
  before_action -> { @current_user = current_user }
  before_action -> { authorize! :manage, AdhesionPrice }

  def create
    @adhesion_price = AdhesionPrice.new(adhesion_price_params)

    if @adhesion_price.save
      render json: @adhesion_price.as_json(include: {season: {}}), status: :created
    else
      render json: @adhesion_price.errors.full_messages, status: :unprocessable_entity
    end
  end

  def update
    @adhesion_price = AdhesionPrice.find(params[:id])

    if @adhesion_price.update(adhesion_price_params)
      render json: @adhesion_price.as_json(include: {season: {}}), status: :ok
    else
      render json: @adhesion_price.errors, status: :unprocessable_entity
    end
  end

  def destroy
    @adhesion_price = AdhesionPrice.find(params[:id])

    if @adhesion_price.destroy
      render json: @adhesion_price.as_json(include: {season: {}}), status: :ok
    else
      render json: @adhesion_price.errors, status: :unprocessable_entity
    end
  end

  def index
    @adhesion_prices = AdhesionPrice.all

    render json: @adhesion_prices.as_json(include: {season: {}}), status: :ok
  end

  private

  def adhesion_price_params
    params.require(:adhesion_price).permit(:label, :price, :season_id)
  end
end
