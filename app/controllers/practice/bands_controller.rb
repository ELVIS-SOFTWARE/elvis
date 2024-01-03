class Practice::BandsController < ApplicationController
  before_action :set_band, only: %i[show edit update destroy]
  before_action :set_current_user
  before_action :set_referentials, only: %i[new edit]

  # GET /bands
  # GET /bands.json
  def index
    @bands = Band.includes(:band_type, :music_genre, bands_users: :user).all
    authorize! :manage, @bands
  end

  # GET /bands/1
  # GET /bands/1.json
  def show; end

  # GET /bands/new
  def new
    @band = Band.new
    authorize! :manage, @band
  end

  # GET /bands/1/edit
  def edit
    band = Band.includes({ bands_users: %i[user instrument] }).find(params[:id])

    @band = band.as_json({
                           include: {
                             bands_users: { include: %i[user instrument] }
                           }
                         })
    authorize! :manage, @band

  end

  # POST /bands
  # POST /bands.json
  def create
    @band = Band.create(band_params)
    authorize! :manage, @band
    params[:users]&.each do |user|
      if (user[:id]).zero?
        createUser = User.new
        createUser.first_name = user[:first_name]
        createUser.last_name = user [:last_name]
        createUser.save

        @band.bands_users.create(user: createUser, instrument_id: user[:instrument_id])
      else
        editUser = User.find_by(id: user[:id])
        @band.bands_users.create(user: editUser, instrument_id: user[:instrument_id])
      end
    end

    respond_to do |format|
      if @band.save
        format.html { redirect_to "#{parameters_practice_parameters_list_bands_path}#tab-2" }
        format.json { render json: @band, status: :created }
      else
        format.html { set_referentials; render :new }
        format.json { render json: @band.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /bands/1
  # PATCH/PUT /bands/1.json
  def update
    bands_users = BandsUser.where(band_id: @band[:id])

    authorize! :manage, bands_users

    params[:old_members]&.each do |user|
      bu = bands_users.nil? ? nil : bands_users.find_by(first_name: user[:first_name], last_name: user[:last_name])

      edit_user = if user[:id].zero?
                    User.new(first_name: user[:first_name], last_name: user[:last_name]) # creer un user fictif qui ne seras pas persister en bdd
                  else
                    User.find_by(id: user[:id])
                  end

      if !user[:first_name].nil? && !user[:last_name].nil? && !bu.nil?
        bu.instrument_id = user[:instrument_id]
        bu.first_name = user[:first_name]
        bu.last_name = user[:last_name]
        bu.email = user[:email]
        bu.left_at = bu.left_at.nil? ? Time.now.utc : bu.left_at
        bu.user = edit_user if bu.user.nil?

        bu.save!
      end
    end

    params[:users]&.each do |user|
      edit_user = if user[:id].zero?
                    User.new(first_name: user[:first_name], last_name: user[:last_name]) # creer un user fictif qui ne seras pas persister en bdd
                  else
                    User.find_by(id: user[:id])
                  end
      bu = bands_users.nil? ? nil : bands_users.find_by(first_name: user[:first_name], last_name: user[:last_name])

      if bu.nil?
        @band.bands_users.create!(user: edit_user, instrument_id: user[:instrument_id], first_name: user[:first_name],
                                  last_name: user[:last_name], email: edit_user.email.nil? || edit_user.email.empty? ? user[:email] : edit_user.email, joined_at: Time.now.utc)
      else
        bu.instrument_id = user[:instrument_id]
        bu.first_name = user[:first_name]
        bu.last_name = user[:last_name]
        bu.email = (edit_user.email.nil? || edit_user.email.empty? ? user[:email] : edit_user.email)
        bu.user = edit_user if bu.user.nil?

        bu.joined_at = Time.now.utc if bu.joined_at.nil?
        bu.left_at = nil

        bu.save!
      end
    end

    respond_to do |format|
      if @band.update!(band_params)
        format.html { redirect_to "#{parameters_practice_parameters_list_bands_path}#tab-2" }
        format.json { render json: @band, status: :created }
      else
        format.html { set_referentials; render :edit }
        format.json { render json: @band.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /bands/1
  # DELETE /bands/1.json
  def destroy
    authorize! :manage, @band

    begin
      @band.destroy
      respond_to do |format|
        format.html { redirect_to practice_bands_url, notice: "Band was successfully destroyed." }
        format.json { render json: @band, status: :ok }
      end
    rescue StandardError => e
      render json: e.message, status: :internal_server_error
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
  def set_band
    @band = Band.find(params[:id])
  end

    # Never trust parameters from the scary internet, only allow the white list through.
  def band_params
    params.require(:band).permit(:id, :name, :blacklisted, :music_genre_id, :band_type_id)
  end

  def set_referentials
    @music_genres = MusicGenre.order(:name)
    @band_types = BandType.order(:name)
    @instruments = Instrument.all
  end
end
