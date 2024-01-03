class Parameters::CommunityParametersController < ApplicationController

  def index
    #  TODO analyser l'impact de la modification de déf de Season.current (ne renvoie plus un tableau d'un seul élément mais renvoie désormais le 1er (et seul) élément de ce tableau)
    @season = Season.current
  end

end
