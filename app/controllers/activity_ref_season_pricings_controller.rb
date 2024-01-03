class ActivityRefSeasonPricingsController < ApplicationController

    # @deprecated
    # Remplacé par ActivityRefPricing

    def create
        @activity_ref_season_pricing = ActivityRefSeasonPricing.create(params_create)
        render :json => @activity_ref_season_pricing
    end

    private
    def params_create
        params.require(:activity_ref_season_pricing).permit(:activity_ref_id, :season_id, :pricing_id, :price)
    end
end