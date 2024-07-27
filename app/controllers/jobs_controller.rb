# frozen_string_literal: true

class JobsController < ApplicationController

  before_action -> { @current_user = current_user }

  def show_status
    job_id = params[:id]
    status = ActiveJob::Status.get(job_id)

    render status: :not_found, json: { error: "no such job" } and return if status.nil?

    begin
      read = status.read
      render status: :not_found, json: { error: "no such job" } and return if read == {}

      render json: { jobStatus: read }
    rescue StandardError => e
      render status: :internal_server_error, json: { error: e.message } and return
    end

  end
end
