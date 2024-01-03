class CguController < ApplicationController
  skip_before_action :authenticate_user!

  def index
    @school_name = @school_informations.name
    @admin_email = @school_informations.email

    render :index, layout: "simple" if @current_user.nil?
  end
end
