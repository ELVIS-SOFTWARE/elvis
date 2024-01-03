# frozen_string_literal: true

module Practice
  class PlanningController < ApplicationController
    before_action :set_current_user

    def index
      @rooms = Room.practice
      @bands = Band.where.not(blacklisted: true)
      date = Time.now.beginning_of_day
      # pp "here" # == puts "here"
      @practice_sessions = PracticeSession.time_interval_by_period(date, date + 1.day)
                                          .as_json(include: %i[time_interval band])
    end

    # GET /planning/1
    # GET /planning/1.json
    def show; end
  end
end
