class SeasonsController < ApplicationController
  skip_before_action :authenticate_user!, only: [:available_evaluation_intervals]

  def index
    @current_user = current_user
    @seasons = Season.all

    authorize! :manage, @current_user.is_admin

    respond_to do |format|
      format.html 

      format.json do
          render json: @seasons.as_json(
              include: :holidays,
              except: [:created_at, :updated_at, :deleted_at] )
      end
    end
  end

  def new
    @current_user = current_user
    @season = Season.new

    authorize! :manage, @current_user.is_admin
  end

  def show
    @season = Season.find(params[:id])

    redirect_to edit_season_path @season
  end

  def get_season_weeks
    render json: Seasons::GetSeasonWeeks.new.execute
  end

  def get_evaluation_weeks
    render json: StudentEvaluations::GetEvaluationWeeks.new.execute
  end

  def create
    @season = Season.new season_params

    #SwitchSeasonJob.perform_now @season.id

    if @season.save && @season.errors.empty?
      # TODO: Extract business logic to service
      #
      # aller chercher les zones dans les données de l'école
      bank_holidays_zone = Holidays::BankHolidays.read_zone_parameter
      school_academy = Holidays::SchoolHolidays.read_academy_parameter

      if bank_holidays_zone && school_academy
        Seasons::PopulateHolidays
          .new(season: @season, bank_holidays_zone: bank_holidays_zone, academie: school_academy)
          .execute
      end

      redirect_to seasons_path, method: :get
    else
      @current_user = current_user
      flash.now[:alert] = {errors: @season.errors.to_hash(true)}
      render :new
    end
  end

  #  action pour ajouter manuellement des vacances
  def create_holidays
    respond_to do |format|
      format.json do
        @season = Season.find params[:id]

        json = false

        unless @season.nil? || params[:label].empty? || params[:start].empty? || params[:end].empty?
          start = Date.parse params[:start]
          dend  = Date.parse params[:end]

          if start <= dend
            is_one_register = false
            (start..dend).each do |date|
              @season.holidays << Holiday.new(date: date, label: params[:label], kind: "school")
              is_one_register ||= true
            end

            json = { label: params[:label], start: params[:start], end: params[:end] } if is_one_register
          end
        end
        render json: json
      end
    end
  end

  def delete_holidays
    respond_to do |format|
      format.json do
        holidays = Holiday.where(label: params[:label]).where("date >= ? and date <= ?", Date.parse(params[:start]),
                                                              Date.parse(params[:end])).all

        holidays.destroy_all

        render json: holidays.empty?
      end
    end
  end

  # action pour récupérer les vacances et jours fériés depuis une API publique
  # et les ajouter à la saison sélectionnée
  def fetch_holidays
    respond_to do |format|
      @season = Season.find params[:id]

      # ===================================
      # on commence par peupler la saison avec les jours fériés de la zone et les vacances de l'académie

      bank_holidays_zone = Holidays::BankHolidays.read_zone_parameter
      school_holidays_zone = Holidays::SchoolHolidays.read_zone_parameter
  
      if bank_holidays_zone && school_holidays_zone
        Seasons::PopulateHolidays
          .new(season: @season, bank_holidays_zone: bank_holidays_zone, school_zone: school_holidays_zone)
          .execute
      end

      # ===================================
      # puis on parcourt et on renvoie en JSON tout le paquet de vacances résultant

      format.json do
        # "compression" de la liste des vacances pour envoi
        json = Holidays::HolidaysPacker.pack_holidays(@season)
        render json: json
      end
    end
  end

  # action pour rendre active la saison sélectionnée
  def make_active
    @current_user = current_user
    season = Season.find(params[:id])
    next_season = season.next

    authorize! :manage, @current_user.is_admin

    result = Seasons::SeasonSwitcher.execute(season)

    if result
      render json: {new_next_season: next_season.nil?, next: (next_season || season.next)&.as_json(except: [:created_at, :updated_at, :deleted_at], include: :next_season, methods: [:start_formatted, :end_formatted])}, status: :ok
    else
      head :unprocessable_entity
    end
  end

  def edit
    @current_user = current_user
    @season = Season.find(params[:id])

    authorize! :manage, @current_user.is_admin

    # "compression" de la liste des vacances pour envoi
    @holidays = Holidays::HolidaysPacker.pack_holidays(@season)
  end

  def update
    @current_user = current_user

    @season = Season.find(params[:id])
    result = @season.update(season_params)
    logger.error "Unable to update season with params #{season_params} ; error is : #{@season.errors.to_a}" if @season.errors

    # workaround pour supprimer la saison suivante
    # lorsque le front renvoie 0 pour next_season_id
    # (NB : le fait de remplacer dans params la valeur "0" par nil déclenche une Exception ActiveRecord - genre paramètres invalides)
    if params[:season][:next_season_id] == "0"
      @season.next_season_id = nil
      result &&= @season.save
    end

    if result
      redirect_to seasons_path
    else
      #redirect_to edit_season_path(season_params), alert: {title: "Impossible de sauvegarder la saison", errors: @season.errors.to_h}
      @current_user = current_user
      @holidays = Holidays::HolidaysPacker.pack_holidays(@season)
      flash.now[:alert] = {errors: @season.errors.to_h}
      
      render :edit
    end
  end

  def destroy
    # @type [Season]
    season = Season.find(params[:id])

    return render json: {error: "Impossible de supprimer la saison active"}, status: :unprocessable_entity if season.is_current

    FamilyMemberUser.where(season: season).destroy_all
    previous_season = season.previous

    if previous_season
      previous_season.next_season_id = nil
      previous_season.save!
    end

    season.destroy

    head :ok
  end

  def available_evaluation_intervals
    season = Season.find(params[:id]).previous
    activity_ref = ActivityRef.find(params[:activity_ref_id])
    intervals = TimeInterval
                .evaluation
                .validated
                .joins(evaluation_appointment: :activity_ref)
                .where({
                         start: (season.start..(season.start + 1.year)),
                         evaluation_appointments: {
                           activity_refs: {
                             activity_ref_kind: activity_ref.activity_ref_kind
                           },
                           student_id: nil,
                           activity_application_id: nil
                         }
                       })
                .uniq { |i| i.start.strftime("%u%H%M") + i.end.strftime("%u%H%M") }

    @intervals = intervals.as_json

    render json: @intervals
  end

  private

  def season_params
    if params[:season][:next_season_id] == "0"
      params.require(:season).permit(
        :label,
        :nb_lessons,
        :start,
        :end,
        :opening_date_for_applications,
        :opening_date_for_new_applications,
        :closing_date_for_applications,
        :date_for_teacher_planning_validation,
        :is_current,
        # :is_next,
        :is_off
      )
    else
      params.require(:season).permit(
        :label,
        :nb_lessons,
        :start,
        :end,
        :opening_date_for_applications,
        :opening_date_for_new_applications,
        :closing_date_for_applications,
        :date_for_teacher_planning_validation,
        :is_current,
        # :is_next,
        :next_season_id,
        :is_off
      )
    end
  end
end
