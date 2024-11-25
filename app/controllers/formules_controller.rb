class FormulesController < ApplicationController

  def index
    @formules = Formule.all

    respond_to do |format|
      format.html
      format.json { render json: @formules.as_json }
    end
  end

  private


end
