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

        render json: @desired_activity
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

    def find_by_user_and_activity
        user_id     = params[:user_id]
        activity_id = params[:activity_id]

        # On récupère la DesiredActivity, qu’elle vienne d’une inscription « active »
        # ou d’une option
        desired_activity = DesiredActivity
                             .joins(:activity_application)
                             .where("activity_applications.user_id = ? AND desired_activities.activity_id = ?", user_id, activity_id)
                             .first

        if desired_activity.nil?
            option = Option.find_by(activity_id: activity_id)
            desired_activity = option&.desired_activity
        end

        if desired_activity
            # On cherche, pour cet utilisateur / saison / activité, son objet Level
            # qui contient evaluation_level_ref
            application = desired_activity.activity_application
            level = Level.find_by(
              user:      application.user,
              season:    application.season,
              activity_ref: desired_activity.activity_ref
            )

            render json: {
              id:                       desired_activity.id,
              activity_application_id:  desired_activity.activity_application_id,
              evaluation_level_ref:     level&.evaluation_level_ref&.label
            }
        else
            render json: { error: "Demande d'inscription introuvable" }, status: 404
        end
    end


    def update_prorata
        desired_activity = DesiredActivity.find(params[:id])

        if desired_activity.nil?
            return head :not_found
        end

        prorata = params[:prorata].to_i

        if prorata < 0
            return render json: { error: "Le prorata ne peut pas être négatif" }, status: :unprocessable_entity
        end

        activity = desired_activity.activity
        if activity && prorata > activity.intended_nb_lessons
            return render json: { error: "Le prorata ne peut pas dépasser le nombre de séances prévues" }, status: :unprocessable_entity
        end

        desired_activity.update!(prorata: prorata)
        head :ok
    end

    private
    def update_params
        params.require(:desired_activity).permit(:activity_ref_id)
    end
end