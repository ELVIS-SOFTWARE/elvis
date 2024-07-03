class PingController < ActionController::Base
  # do not log the request
  self.logger = nil

  def index
    render json: { message: 'Pong' }
  end
end
