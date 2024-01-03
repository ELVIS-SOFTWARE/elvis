class ActivitiesInstrumentsController < ApplicationController
    def create
        @activities_instrument = ActivitiesInstrument.create!(model_params)

        render :json => @activities_instrument.as_json(include: :user)
    end

    def update
        activities_instrument = ActivitiesInstrument.find(params[:id])
        activities_instrument.update!(model_params)

        render :json => activities_instrument.as_json(include: :user)
    end

    def destroy
        ActivitiesInstrument.destroy(params[:id])
        render :json => { :res => "ok" }
    end

    def add_option
        @activities_instrument = ActivitiesInstrument.find(params[:id])
        @desired_activity = DesiredActivity.find(params[:desired_activity_id])

        Activity.transaction do 
            Activities::AddStudent
                .new(@activities_instrument.activity_id, @desired_activity.id, true)
                .execute

            attempt_date = @activities_instrument
                .activity
                &.activity_instances
                &.joins(:time_interval)
                &.where("time_intervals.start > ?", Time.zone.now)
                &.order("time_intervals.start asc")
                &.first
                &.time_interval
                &.start
                &.to_date

            @activities_instrument.update!(user: @desired_activity.activity_application.user, is_validated: false, attempt_date: attempt_date)
        end

        render :json => Utils.format_for_suggestion(@desired_activity.activity_application.user, @activities_instrument.activity, @desired_activity.activity_application.begin_at)
    end

    def remove_option
        @activities_instrument = ActivitiesInstrument.find(params[:id])
        @desired_activity = DesiredActivity.find(params[:desired_activity_id])

        ActivitiesInstrument.transaction do
            @activities_instrument.update!(user: nil, is_validated: false, attempt_date: nil)
            @activities_instrument.activity.remove_student(params[:desired_activity_id], true)
        end

        render :json => Utils.format_for_suggestion(@desired_activity.activity_application.user, @activities_instrument.activity, @desired_activity.activity_application.begin_at)
    end

    def add_student
        @activities_instrument = ActivitiesInstrument.find(params[:id])
        @desired_activity = DesiredActivity.find(params[:desired_activity_id])

        # first remove option
        @activities_instrument.activity.remove_student(params[:desired_activity_id], true)

        # then add student
        Activities::AddStudent
            .new(@activities_instrument.activity_id, params[:desired_activity_id])
            .execute

        @activities_instrument.update!(user: @desired_activity.activity_application.user, is_validated: true, attempt_date: nil)

        render :json => Utils.format_for_suggestion(@desired_activity.activity_application.user, @activities_instrument.activity, @desired_activity.activity_application.begin_at)
    end

    def remove_student
        @activities_instrument = ActivitiesInstrument.find(params[:id])
        @desired_activity = DesiredActivity.find(params[:desired_activity_id])

        @activities_instrument.activity.remove_student(params[:desired_activity_id])
        @activities_instrument.update!(user: nil, is_validated: false, attempt_date: nil)

        render :json => Utils.format_for_suggestion(@desired_activity.activity_application.user, @activities_instrument.activity, @desired_activity.activity_application.begin_at)
    end

    private
    def model_params
        params
            .require(:activities_instrument)
            .permit(
                :instrument_id,
                :attempt_date,
                :student_id,
                :activity_id
            )
    end
end