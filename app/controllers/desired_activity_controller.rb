class DesiredActivityController < ApplicationController
    def update
        des = DesiredActivity.find(params[:id])

        #reset options
        #we can do it without checking for now because the
        #only update possible for now is the activity_ref id
        des.options.destroy_all

        des.update(update_params)

        @desired_activity = des.as_json include: :options

        render :json => @desired_activity
    end

    def set_pricing
        desired_activity = DesiredActivity.find(params[:id])
        pricing = PricingCategory.find(params[:pricing_id])

        if desired_activity.nil? || pricing.nil?
            return head :not_found
        end

        desired_activity.update!(pricing_category_id: pricing.id)
        head :ok
    end

    # def set_prorata
    #     desired_activity = DesiredActivity.find(params[:id])
    #     desired_activity.prorata = params[:prorata]
    #
    #     desired_activity.save!
    # end

    private
    def update_params
        params.require(:desired_activity).permit(:activity_ref_id)
    end
end
