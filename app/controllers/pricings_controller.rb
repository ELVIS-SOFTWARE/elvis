class PricingsController < ApplicationController
  check_authorization

  def index
    authorize! :read, Pricing

    @error = flash[:error]
    @message = flash[:message]
    @current_user = current_user # current_user vient de cancancan
    @pricings = Pricing.order(:id)
  end

  def new
    authorize! :create, Pricing

    @current_user = current_user
  end

  def create
    authorize! :create, Pricing
    pricing = Pricing.create(pricing_params)
    redirect_to "#{parameters_payment_parameters_path}#tab-2"
  end

  def edit
    authorize! :edit, Pricing

    @current_user = current_user
    @pricing = Pricing.find(params[:id])
  end

  def update
    authorize! :edit, Pricing

    @pricing = Pricing.find(params[:id])
    @pricing.update(pricing_params)

    redirect_to "#{parameters_payment_parameters_path}#tab-2"
  end

  def destroy
    authorize! :destroy, Pricing

    pricing = Pricing.find(params[:id])
    linked_activity_ref_season_pricings = ActivityRefPricing.where(pricing: pricing)

    respond_to do |format|
      format.html do
        if linked_activity_ref_season_pricings.any?
          flash[:error] = "Ce type de tarif est lié à #{linked_activity_ref_season_pricings.count} objet(s)"
        else
          pricing.destroy
          flash[:message] = "La suppression s'est déroulée avec succès."
        end

        redirect_to pricings_path
      end

      format.json do
        if linked_activity_ref_season_pricings.any?
          render json: "Ce type de tarif est lié à #{linked_activity_ref_season_pricings.count} objet(s)", status: :unprocessable_entity
        else
          pricing.destroy
          render json: "La suppression s'est déroulée avec succès."
        end
      end
    end
  end

    private
  def pricing_params
    params.require(:pricing).permit(:label)
  end
end
