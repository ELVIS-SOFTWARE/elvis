class Practice::SessionsController < ApplicationController
    def create
        @current_user = User.find(params[:current_user][:id])
        band = Band.find(params[:band][:id])
        room = Room.find(params[:room][:id])
        ps = Practices::CreateSession.new(band, room, params[:start], params[:stop]).execute
        render json: ps.as_json({includes: :time_intervals})
    end

    def index
        start = params[:start] ? Time.parse(params[:start]) : Time.now.beginning_of_day
        stop = params[:stop] ? Time.parse(params[:stop]) : start + 1.day
        render json:  PracticeSession.time_interval_by_period(start, stop).as_json(include: [:time_interval, :band])
    end

    # PATCH/PUT '/practice/sessions/:id'
    def update
        session = PracticeSession.find(params[:id])
        can? :update, session
        session.room_id = params[:room] if params[:room]
        session.band_id = params[:band] if params[:band]
        session.time_interval.update!(start: Time.parse(params[:start])) if params[:start]
        session.time_interval.update!(end: Time.parse(params[:end])) if params[:end]
        result = session.save
        render json: {result: result, session: session}
    end

    # DEL `/practice/sessions/:id`
    def destroy
        session = PracticeSession.find(params[:id]);
        can? :delete, session
        render json: {result: session.delete}
    end
end
