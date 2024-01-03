# frozen_string_literal: true

module Practice
  class RoomFeaturesController < ApplicationController

    before_action :set_current_user
    before_action :set_rfeatures, only: %i[show edit destroy update]

    def index
      @room_features = RoomFeatures.all
      authorize! :manage, @room_features
    end

    def show; end

    def edit
      authorize! :manage, @room_feature
    end

    def new
      @room_feature = RoomFeatures.new
      authorize! :manage, @room_feature
    end

    # POST /room_features
    # POST /room_features.json
    def create
      @room_feature = RoomFeatures.new(feature_params)
      authorize! :manage, @room_feature

      respond_to do |format|
        if !@room_feature.name.blank? && @room_feature.save
          format.html { redirect_to "#{parameters_practice_parameters_path}#tab-5" }
          format.json { render :show, status: :created, location: @room_feature }
        else
          format.html { render :new }
          format.json { render json: @room_feature.errors, status: :unprocessable_entity }
        end
      end
    end

    # PATCH/PUT /room_features/1
    # PATCH/PUT /room_features/1.json
    def update
      authorize! :manage, @room_feature

      respond_to do |format|
        if @room_feature.update(feature_params)
          format.html { redirect_to "#{parameters_practice_parameters_path}#tab-5" }
          format.json { render :show, status: :ok, location: @room_feature }
        else
          format.html { render :edit }
          format.json { render json: @room_feature.errors, status: :unprocessable_entity }
        end
      end
    end

    def destroy
      authorize! :manage, @room_feature
      @room_feature&.destroy

      respond_to do |format|
        format.html { redirect_to practice_room_features_path }
        format.json { render json: @room_feature, status: :ok }
      end
    end

    private

    def set_rfeatures
      @room_feature = RoomFeatures.find(params[:id])
    end

    def feature_params
      params.require(:room_features).permit(:name, :active)
    end
  end
end
