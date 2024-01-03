module Practice
  class BandTypesController < ApplicationController
    before_action :set_band_type, only: %i[show edit update destroy]
    before_action :set_current_user

    # GET /band_types
    # GET /band_types.json
    def index
      @band_types = BandType.all
      authorize! :manage, @band_types
    end

    # GET /band_types/1
    # GET /band_types/1.json
    def show
      authorize! :manage, @band_type
    end

    # GET /band_types/new
    def new
      @band_type = BandType.new
      authorize! :manage, @band_type
    end

    # GET /band_types/1/edit
    def edit
      authorize! :manage, @band_type
    end

    # POST /band_types
    # POST /band_types.json
    def create
      @band_type = BandType.new(band_type_params)
      authorize! :manage, @band_type

      respond_to do |format|
        if @band_type.save
          format.html { redirect_to "#{parameters_practice_parameters_path}#tab-0" }
          format.json { render :show, status: :created, location: @band_type }
        else
          format.html { render :new }
          format.json { render json: @band_type.errors, status: :unprocessable_entity }
        end
      end
    end

    # PATCH/PUT /band_types/1
    # PATCH/PUT /band_types/1.json
    def update
      authorize! :manage, @band_type
      respond_to do |format|
        if @band_type.update(band_type_params)
          format.html { redirect_to "#{parameters_practice_parameters_path}#tab-0" }
          format.json { render :show, status: :ok, location: @band_type }
        else
          format.html { render :edit }
          format.json { render json: @band_type.errors, status: :unprocessable_entity }
        end
      end
    end

    # DELETE /band_types/1
    # DELETE /band_types/1.json
    def destroy
      authorize! :manage, @band_type

      @band_type.destroy!
      respond_to do |format|
        format.html { redirect_to practice_band_types_url, notice: "Band type was successfully destroyed." }
        format.json { render json: @band_type, status: :ok }
      end
    end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_band_type
      @band_type = BandType.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def band_type_params
      params.require(:band_type).permit(:name)
    end
  end
end
