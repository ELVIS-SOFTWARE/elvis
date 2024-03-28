class Parameters::PlanningParametersController < ApplicationController

  def index
    show_availabilities = Parameter.find_or_create_by(
      label: "planning.show_disponibilities",
      value_type: "boolean"
    )

    teacher_can_edit_planning = Parameter.find_or_create_by(
      label: "planning.teacher_can_edit_planning",
      value_type: "boolean"
    )

    @show_availabilities = show_availabilities.parse
    @teacher_can_edit_planning = teacher_can_edit_planning.parse
    @school = School.first

    if @school.planning.nil?
      @school.create_planning
      @school.save!
    end

    current_season = Season.current

    if @school.planning.time_intervals.where(start: current_season.start..current_season.end).empty?
      previous_season = Season.previous
      school_availabilities = @school.planning.time_intervals.where(start: previous_season.start..previous_season.end).to_a

      school_availabilities = school_availabilities.map do |availability|
        av = availability.dup
        av.id = nil

        av.convert_to_first_week_of_season(current_season)

        av
      end

      @school.planning.time_intervals << school_availabilities
      @school.planning.save!
    end

    @seasons = Season.all
  end

  def update
    show_availabilities = Parameter.find_or_create_by(
      label: "planning.show_disponibilities",
      value_type: "boolean"
    )

    teacher_can_edit_planning = Parameter.find_or_create_by(
      label: "planning.teacher_can_edit_planning",
      value_type: "boolean"
    )

    show_availabilities.value = (params[:show_availabilities] == "1").to_s
    teacher_can_edit_planning.value = (params[:teacher_edit] == "1").to_s

    show_availabilities.save
    teacher_can_edit_planning.save

    respond_to do |format|
      format.html { redirect_to parameters_planning_parameters_path }
      format.json { render json: { success: true } }
    end
  end

  def save_hours_before_cancelling_activity
    hours = Parameter.find_or_create_by(
      label: "planning.hours_before_cancelling_activity",
      value_type: "integer"
    )

    hours.value = params[:hours]
    hours.save

    respond_to do |format|
      format.json { render json: { success: true } }
    end
  end

  def get_hours_before_cancelling_activity
    hours = Parameter.find_by(
      label: "planning.hours_before_cancelling_activity",
      value_type: "integer"
    )

    hours = hours.nil? ? 0 : hours.value

    respond_to do |format|
      format.json { render json: { hours: hours } }
    end
  end
end
