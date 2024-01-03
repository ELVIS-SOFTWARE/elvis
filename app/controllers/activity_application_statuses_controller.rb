class ActivityApplicationStatusesController < ApplicationController
    check_authorization

    before_action -> { render status:401, json:{error: "forbidden"} and return }, if: -> { ActivityApplicationStatus::BUILTIN_IDS.include?(params[:id].to_i) }, only: [:edit, :update, :destroy]


    def index
        authorize! :read, ActivityApplicationStatus

        @error = flash[:error]
        @message = flash[:message]
        @current_user = current_user
        @activity_application_statuses = ActivityApplicationStatus.order(:id)
    end

    def new
        authorize! :create, ActivityApplicationStatus
        @current_user = current_user
    end

    def create
        authorize! :create, ActivityApplicationStatus

        status = ActivityApplicationStatus.create(activity_application_status_params)
        redirect_to parameters_activity_application_parameters_path
    end

    def destroy
        authorize! :destroy, ActivityApplicationStatus

        status = ActivityApplicationStatus.find(params[:id])
        linked_applications = ActivityApplication.where(activity_application_status: status)

        respond_to do |format|
            format.json do
                if linked_applications.any?
                    render json: "Ce statut est lié à #{linked_applications.count} demandes d'inscriptions, vous ne pouvez donc pas le supprimer.", status: :unprocessable_entity
                else
                    status.destroy
                    render json: "La suppression s'est déroulée avec succès."
                end
            end

            format.html do
                if linked_applications.any?
                    flash[:error] = "Ce statut est lié à #{linked_applications.count} demandes d'inscriptions, vous ne pouvez donc pas le supprimer."
                else
                    status.destroy
                    flash[:message] = "La suppression s'est déroulée avec succès."
                end

                redirect_to activity_application_statuses_path
            end
        end
    end

    def edit
        authorize! :edit, ActivityApplicationStatus

        @current_user = current_user
        @activity_application_status = ActivityApplicationStatus.find(params[:id])
    end

    def update
        authorize! :edit, ActivityApplicationStatus

        @activity_application_status = ActivityApplicationStatus.find(params[:id])
        @activity_application_status.update(activity_application_status_params)

        redirect_to parameters_activity_application_parameters_path
    end

    private
    def activity_application_status_params
        params.require(:activity_application_status).permit(:label, :is_stopping, :is_active)
    end
end