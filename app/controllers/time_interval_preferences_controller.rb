# frozen_string_literal: true

class TimeIntervalPreferencesController < ApplicationController
  rescue_from ActiveRecord::RecordInvalid, with: :rescue_from_invalid

  def show_available_activities
    render json: ActivityRefs::FindActivityIntervals.new(params[:season_id], params[:activity_ref_id]).execute
  end

  private

  def rescue_from_invalid(exception)
    render json: { errors: exception.record.errors[:base] }, status: 400
  end
end
