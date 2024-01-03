class LocationsController < ApplicationController

  before_action -> { @current_user = current_user }

  def index
    @locations = Location.all

    authorize! :manage, @locations
    respond_to do |format|
      format.html 

      format.json do
          render json: @locations.as_json(
              except: [:created_at, :updated_at, :deleted_at] )
      end
    end
  end

  def new
    @location = Location.new label: flash[:location_label]

    authorize! :manage, @location
  end

  def create
    flash[:error] = []
    location = Location.create location_params

    authorize! :manage, location

    if location.valid?
      redirect_to "#{parameters_rooms_parameters_path}#tab-1"
    else
      flash[:error] = location.errors.full_messages
      flash[:location_label] = location.label

      redirect_to locations_path
    end
  end

  def edit
    flash[:error] = []
    @location = Location.find params[:id]

    authorize! :manage, @location
  end

  def update
    location = Location.find params[:id]

    authorize! :manage, location

    location.label = location_params[:label]
    location.save

    if location.valid?
      redirect_to locations_path
    else
      flash[:error] = location.errors.full_messages

      redirect_to "#{parameters_rooms_parameters_path}#tab-1"
    end
  end

  def destroy
    location = Location.find params[:id]

    authorize! :manage, location

    is_error = false

    begin
      location.destroy
    rescue StandardError
      flash[:error] = "La localisation est reliée à d'autres données (des cours par exemple)"
      is_error = true
    end

    respond_to do |format|
      format.html { redirect_to locations_path }
      format.json { render json: flash[:error], status: is_error ? :unprocessable_entity : :ok }
    end
  end

  private

  def location_params
    params.require(:location).permit(:label)
  end

end
