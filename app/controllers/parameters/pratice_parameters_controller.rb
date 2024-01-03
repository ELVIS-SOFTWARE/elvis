class Parameters::PraticeParametersController < ApplicationController
  def index

  end

  def list_bands
    query = Band.includes(:band_type).includes(:music_genre).all

    params[:filtered].each do |filter|
      query = case filter[:id]
              when "id"
                query.where(id: filter[:value])
              when "genre"
                query.joins(:music_genre).where("music_genres.name ILIKE ?", "#{filter[:value]}%")
              when "type"
                query.joins(:band_type).where("band_types.name ILIKE ?", "#{filter[:value]}%")
              else
                query.where("#{filter[:id]} ILIKE ?", "#{filter[:value]}%")
              end
    end

    respond_to do |format|
      format.json { render json: list_json(query, params, { include: { music_genre: {}, band_type: {} } }) }
    end
  end

  def list_band_type
    query = BandType.all

    params[:filtered].each do |filter|
      query = case filter[:id]
              when "id"
                query.where(id: filter[:value])
              else
                query.where("#{filter[:id]} ILIKE ?", "#{filter[:value]}%")
              end
    end

    respond_to do |format|
      format.json { render json: list_json(query, params) }
    end
  end

  def list_music_genre
    query = MusicGenre.all

    params[:filtered].each do |filter|
      query = case filter[:id]
              when "id"
                query.where(id: filter[:value])
              else
                query.where("#{filter[:id]} ILIKE ?", "#{filter[:value]}%")
              end
    end

    respond_to do |format|
      format.json { render json: list_json(query, params) }
    end
  end

  def list_instruments
    query = Instrument.all

    params[:filtered].each do |filter|
      query = case filter[:id]
              when "id"
                query.where(id: filter[:value])
              else
                query.where("#{filter[:id]} ILIKE ?", "#{filter[:value]}%")
              end
    end

    respond_to do |format|
      format.json { render json: list_json(query, params) }
    end
  end

  def list_materials
    query = Material.all

    params[:filtered].each do |filter|
      query = case filter[:id]
              when "id"
                query.where(id: filter[:value])
              when "active"
                query.where(active: filter[:value] == "oui")
              when "prix"
                query.where(prix: filter[:value])
              else
                query.where("#{filter[:id]} ILIKE ?", "#{filter[:value]}%")
              end
    end

    respond_to do |format|
      format.json { render json: list_json(query, params) }
    end
  end

  def list_features
    query = RoomFeatures.all

    params[:filtered].each do |filter|
      query = case filter[:id]
              when "id"
                query.where(id: filter[:value])
              when "active"
                query.where(active: filter[:value] == "oui")
              else
                query.where("#{filter[:id]} ILIKE ?", "#{filter[:value]}%")
              end
    end

    respond_to do |format|
      format.json { render json: list_json(query, params) }
    end
  end

  def list_flat_rates
    query = FlatRate.all

    params[:filtered].each do |filter|
      query = case filter[:id]
              when "id"
                query.where(id: filter[:value])
              when "enable"
                query.where(enable: filter[:value] == "oui")
              when "nb_hour"
                query.where(nb_hour: filter[:value])
              when "solo_duo_rate"
                query.where(solo_duo_rate: filter[:value])
              when "group_rate"
                query.where(group_rate: filter[:value])
              else
                query.where("#{filter[:id]} ILIKE ?", "#{filter[:value]}%")
              end
    end

    respond_to do |format|
      format.json { render json: list_json(query, params) }
    end
  end

  private

  def list_json(query, params, json_include = {})
    sort_order = params[:sorted][:desc] ? :desc : :asc

    total = query.count

    query = query.order(params[:sorted][:id].to_sym => sort_order)
                 .page(params[:page] + 1)
                 .per(params[:pageSize])

    pages = query.total_pages

    status = query.as_json(json_include)
    authorize! :read, status

    {
      status: status,
      pages: pages,
      total: total
    }
  end
end
