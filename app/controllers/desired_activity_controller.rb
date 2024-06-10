class DesiredActivityController < ApplicationController
    def update
        # @type [DesiredActivity]
        des = DesiredActivity.find(params[:id])

        old_activity_ref = des.activity_ref

        #reset options
        #we can do it without checking for now because the
        #only update possible for now is the activity_ref id
        des.options.destroy_all

        des.update(update_params)

        # update level with the new activity_ref
        user = des.user

        # @type [Level]
        level = user.levels.find_by(season: des.activity_application.season, activity_ref: old_activity_ref)

        if level&.evaluation_level_ref&.present?
            new_level = user.levels.find_or_create_by(season: des.activity_application.season, activity_ref: des.activity_ref)

            if new_level.evaluation_level_ref == nil # cannot use .nil? with &
                new_level.update(evaluation_level_ref: level.evaluation_level_ref)
            end
        end

        @desired_activity = des.as_json include: :options

        render :json => @desired_activity
    end

    def set_pricing
        desired_activity = DesiredActivity.find(params[:id])
        pricing = PricingCategory.find(params[:pricing_category_id])

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
