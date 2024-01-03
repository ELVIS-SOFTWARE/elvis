class Practice::MusicGenresController < ApplicationController
  before_action :set_music_genre, only: [:edit, :update, :destroy]
  before_action :set_current_user

  # GET /music_genres
  # GET /music_genres.json
  def index
    @music_genres = MusicGenre.all
    authorize! :manage, @music_genres
  end

  # GET /music_genres/new
  def new
    @music_genre = MusicGenre.new
    authorize! :manage, @music_genre
  end

  # GET /music_genres/1/edit
  def edit
    authorize! :manage, @music_genre
  end

  # POST /music_genres
  # POST /music_genres.json
  def create
    @music_genre = MusicGenre.new(music_genre_params)
    authorize! :manage, @music_genre

    respond_to do |format|
      if @music_genre.save
        format.html { redirect_to "#{parameters_practice_parameters_path}#tab-1" }
        format.json { render :show, status: :created, location: @music_genre }
      else
        format.html { render :new }
        format.json { render json: @music_genre.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /music_genres/1
  # PATCH/PUT /music_genres/1.json
  def update
    authorize! :manage, @music_genre
    respond_to do |format|
      if @music_genre.update(music_genre_params)
        format.html { redirect_to "#{parameters_practice_parameters_path}#tab-1" }
        format.json { render :show, status: :ok, location: @music_genre }
      else
        format.html { render :edit }
        format.json { render json: @music_genre.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /music_genres/1
  # DELETE /music_genres/1.json
  def destroy
    authorize! :manage, @music_genre
    @music_genre.destroy!
    respond_to do |format|
      format.html { redirect_to practice_music_genres_path, notice: "Music genre was successfully destroyed." }
      format.json { render json: @music_genre, status: :ok }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_music_genre
      @music_genre = MusicGenre.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def music_genre_params
      params.require(:music_genre).permit(:name)
    end
end
