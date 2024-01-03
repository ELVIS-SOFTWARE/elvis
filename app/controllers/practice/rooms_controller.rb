# frozen_string_literal: true

module Practice
  class RoomsController < ApplicationController

    before_action :set_current_user

    # GET practice/rooms
    def index
      @rooms = Room.where(is_practice_room: true).all
    end

    # DELETE /practice/rooms/:id
    def destroy
      can? :manage, PracticeRoomParameter
      room = Room.find(params[:id])
      room.update!(is_practice_room: false)
      redirect_to action: "index"
    end

    # GET /practice/rooms/:id/edit
    def edit
      @room = Room.find(params[:id])
      @room_parameters = PracticeRoomParameter.where(room_id: params[:id]).first
      # pp @room_parameters

      @room_parameters = PracticeRoomParameter.create!(room_id: params[:id]) if @room_parameters.nil?

      @room_parameters = @room_parameters.as_json(include: {
                                                    practice_room_planning: {
                                                      include: {
                                                        monday => {},
                                                        tuesday => {},
                                                        wednesday => {},
                                                        thursday => {},
                                                        friday => {},
                                                        saturday => {},
                                                        sunday => {}
                                                      }
                                                    }
                                                  })
    end
  end
end
