class MessagesController < ApplicationController
    def create
        authorize! :write, Message
        MessageMailer.with(message: params[:message].as_json, to: params[:to].as_json, from: @current_user).send_message.deliver_later
    end
end