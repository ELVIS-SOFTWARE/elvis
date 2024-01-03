# frozen_string_literal: true

module Practice
  class MaterialsController < ApplicationController
    before_action :set_material, only: %i[show edit update destroy]
    before_action :set_current_user

    def index
      @materials = Material.all
      authorize! :manage, @materials
    end

    # GET /materials/1
    # GET /materials/1.json
    def show
      authorize! :manage, @material
    end

    # GET /materials/new
    def new
      @material = Material.new
      authorize! :manage, @material
    end

    # GET /materials/1/edit
    def edit
      @material = Material.find(params[:id])
      authorize! :manage, @material
    end

    # POST /materials
    # POST /materials.json
    def create
      @material = Material.new(material_params)
      authorize! :manage, @material

      respond_to do |format|
        if !@material.name.blank? && @material.save
          format.html { redirect_to "#{parameters_practice_parameters_path}#tab-3" }
          format.json { render :show, status: :created, location: @material }
        else
          format.html { render :new }
          format.json { render json: @material.errors, status: :unprocessable_entity }
        end
      end
    end

    # PATCH/PUT /materials/1
    # PATCH/PUT /materials/1.json
    def update
      authorize! :manage, @material

      mat_params = material_params
      mat_params[:prix] = 0 if !mat_params[:prix].nil? && mat_params[:prix].to_f.negative?

      respond_to do |format|
        if @material.update(mat_params)
          format.html { redirect_to "#{parameters_practice_parameters_path}#tab-3" }
          format.json { render :show, status: :ok, location: @material }
        else
          format.html { render :edit }
          format.json { render json: @material.errors, status: :unprocessable_entity }
        end
      end
    end

    def destroy
      mat = Material.find params[:id]
      authorize! :manage, mat

      mat&.destroy

      respond_to do |format|
        format.html { redirect_to practice_materials_path }
        format.json { render json: mat, status: :ok }
      end
    end

    private

    # Use callbacks to share common setup or constraints between actions.
    def set_material
      @material = Material.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def material_params
      params.require(:material).permit(:name, :active, :prix)
    end
  end
end
