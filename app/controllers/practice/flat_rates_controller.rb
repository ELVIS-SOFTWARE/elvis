# frozen_string_literal: true

module Practice
  class FlatRatesController < ApplicationController
    before_action :set_flat_rates, only: %i[show edit update destroy]
    before_action :set_current_user

    def index
      @flat_rates = FlatRate.all
      authorize! :manage, @flat_rates
    end

    # GET /flat_rates/new
    def new
      @flat_rate = FlatRate.new
      authorize! :manage, @flat_rate
    end

    # GET /flat_rates/1/edit
    def edit
      authorize! :manage, @flat_rate
    end

    # POST /flat_rates
    # POST /flat_rates.json
    def create
      @flat_rate = FlatRate.new(flat_rate_params)
      authorize! :manage, @flat_rate

      respond_to do |format|
        if @flat_rate.save
          format.html { redirect_to "#{parameters_practice_parameters_path}#tab-4" }
          format.json { render :show, status: :created, location: @flat_rate }
        else
          format.html { render :new }
          format.json { render json: @flat_rate.errors, status: :unprocessable_entity }
        end
      end
    end

    # PATCH/PUT /flat_rates/1
    # PATCH/PUT /flat_rates/1.json
    def update
      authorize! :manage, @flat_rate

      respond_to do |format|
        if @flat_rate.update(flat_rate_params)
          format.html { redirect_to "#{parameters_practice_parameters_path}#tab-4" }
          format.json { render :show, status: :ok, location: @flat_rate }
        else
          format.html { render :edit }
          format.json { render json: @flat_rate.errors, status: :unprocessable_entity }
        end
      end
    end

    def destroy
      authorize! :manage, @flat_rate
      @flat_rate&.destroy

      respond_to do |format|
        format.html { redirect_to practice_flat_rates_path }
        format.json { render json: @flat_rate, status: :ok }
      end
    end

    private

    # Use callbacks to share common setup or constraints between actions.
    def set_flat_rates
      @flat_rate = FlatRate.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def flat_rate_params
      params.require(:flat_rate).permit(:name, :enable, :nb_hour, :solo_duo_rate, :group_rate)
    end
  end
end
