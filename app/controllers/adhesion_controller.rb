class AdhesionController < ApplicationController

  def index
    @current_user = current_user

    authorize! :manage, @current_user.is_admin
  end

  def set_validity_dates
    date = Date.new(2018, 7, 5)
    Adhesion.all.each do |a|
      aa_date = a.user.activity_application.created_at
      if aa_date <= date
        a.validity_start_date = date
        a.validity_end_date = date.next_year
      else
        a.validity_start_date = aa_date
        a.validity_end_date = aa_date.next_year
      end
      a.save
    end
  end

  def update_adhesion_pricing
    adhesion = Adhesion.find(params[:id])

    authorize! :manage, adhesion

    render json: { error: "Adhesion not found or pricing is empty" }, status: :not_found and return if !adhesion || !params[:adhesion_price_id]

    if adhesion.update(adhesion_price_id: params[:adhesion_price_id])
      render json: { adhesion: adhesion.as_json(include: { user: {}, adhesion_price: {} }) }
    else
      render json: { error: adhesion.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def new
    @current_user = current_user
    @season = Season.current_apps_season
  end

  def create
    begin
      Adhesions::CreateAdhesion.new(params[:user_id],params[:validity_start_date]).execute
    rescue ArgumentError => e
      Rails.logger.error e
      flash[:error] = "Impossible de créer l'adhésion"
    end

    redirect_to controller: :adhesion, action: :index
  end

  def reminder
    adhesion = Adhesion.find(params[:id])
    user = User.find(adhesion.user.id)
    adhesion.last_reminder = DateTime.now
    if adhesion.save
      AdhesionMailer.with(user: user).reminder_email.deliver_later
    end
  end

  def destroy
    to_destroy = Adhesion.find(params[:id])
    to_destroy.destroy
  end

  def list
    query = Adhesion.joins("INNER JOIN users ON users.id = adhesions.user_id").includes(:adhesion_price)

    adhesions = query
        .order("#{params[:sorted][:id]} #{params[:sorted][:desc] ? "desc" : "asc"}");

    params[:filtered].each do |filter|
      if filter[:id] == "users.adherent_number" && filter[:value].match?(/\d+/)
        adhesions = adhesions.where("users.adherent_number = #{Integer(params[:filtered][0][:value], 10)}");
      elsif filter[:id] == "validity_end_date" && filter[:value]
        adhesions = adhesions.where("extract(days from adhesions.validity_end_date - now()) > 0 AND extract(days from adhesions.validity_end_date - now()) < 30")
      elsif filter[:id] == "users.first_name" || filter[:id] == "users.last_name"
        adhesions = adhesions.where("LOWER(#{params[:filtered][0][:id]}) LIKE ?", "#{params[:filtered][0][:value].downcase}%");
      end
    end

    total = adhesions.count

    adhesions = adhesions
        .page(params[:page] + 1)
        .per(params[:pageSize]);

    pages = adhesions.total_pages

    @adhesions = adhesions.as_json({ include: { user: {}, adhesion_price: {} } })
    authorize! :read, @adhesions

    render json: { adhesions: @adhesions, pages: pages, total: total }
  end
end
