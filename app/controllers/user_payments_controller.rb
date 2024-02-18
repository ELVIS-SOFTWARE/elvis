
class UserPaymentsController < ApplicationController

  before_action :set_current_user

  def show_for_current
    @user = @current_user

    show_for_common
  end

  def show_for_user
    return show_for_current if params[:id] == "payments"

    @user = User.find(params[:id])

    return redirect_to user_payments_for_current_path if @user.id == @current_user.id

    authorize! :edit, @user

    show_for_common
  end

  def get_data_for_season
    season = Season.find_by(id: params[:season_id]) || Season.current
    user = User.find(params[:id])

    authorize! :read, user

    # equivalent optimisé de PaymentsController.instance_method(:generate_data_for_payment_summary_table)

    data = PaymentHelper.generate_payer_payment_summary_data(user, season)

    # fin de l'équivalent optimisé

    # début du calcul des paiements dus

    payment_schedule = user.payment_schedules.find_by(season_id: season.id)
    due_payments = payment_schedule&.due_payments || []

    due_payments_data = due_payments.map do |due_payment|
      {
        id: due_payment.id,
        amount: due_payment.adjusted_amount,
        due_date: due_payment.previsional_date,
        status: if due_payment.payments.where(payment_status_id: PaymentStatus::PAID_ID).sum(:amount) >= due_payment.adjusted_amount
                  0 # paid
                elsif due_payment.previsional_date < DateTime.now
                  2 # late
                else
                  1 # pending
                end
      }
    end

    # fin du calcul des paiements dus

    # methode de paiement

    payer_payment_terms = user.payer_payment_terms.where(season_id: season.id).first&.as_json(include: [:payment_schedule_options, :payment_method])
    payment_schedule_option = payer_payment_terms&.dig("payment_schedule_options")

    payment_terms_data = {
      term_name: payer_payment_terms&.dig("payment_schedule_options", "label"),
      payment_method: payer_payment_terms&.dig("payment_method", "label"),
      day_for_collection: payment_schedule_option.nil? || payer_payment_terms.nil? ? 0 : payment_schedule_option["available_payments_days"][payer_payment_terms["day_for_collection"]]
    }

    # fin de la methode de paiement

    respond_to do |format|
      format.json { render json: {
        general_infos: data,
        due_payments: due_payments_data.sort_by { |e| e[:due_date] }.reverse,
        payer_payment_terms: payment_terms_data
      }}
    end
  end

  def get_user_payment_terms_for_season
    user = User.find(params[:id])

    authorize! :read, user

    payment = user.payer_payment_terms.where(season_id: params[:season_id]).first

    respond_to do |format|
      format.json { render json: payment.as_json(only: [:payment_method_id, :payment_schedule_options_id, :day_for_collection]) }
    end
  end

  def update_user_payment_terms_for_season
    user = User.find(params[:id])

    authorize! :update, user

    season = Season.find_by(id: params[:season_id])

    if season.nil?
      respond_to do |format|
        format.json { render json: { error: "Season not found" }, status: :unprocessable_entity }
      end
      return
    end

    user_payment_term = user.payer_payment_terms.where(season_id: season.id).first

    creation = false

    if user_payment_term.nil?
      user_payment_term = user.payer_payment_terms.create(
        season_id: season.id,
        payment_method_id: params[:payment_method_id],
        payment_schedule_options_id: params[:payment_schedule_options_id],
        day_for_collection: params[:day_for_collection]
      )

      creation = true
    else
      # do not permit update of payment_schedule_options_id
      user_payment_term.update(
        payment_method_id: params[:payment_method_id],
        day_for_collection: params[:day_for_collection]
      )
    end

    SyncDuePaymentWithPayerTermsJob.perform_now(id: user_payment_term.id, creation: creation)

    respond_to do |format|
      format.json { render json: user_payment_term.as_json(only: [:payment_method_id, :payment_schedule_options_id, :day_for_collection]) }
    end
  end

  private

  def show_for_common
    @seasons = Season.all

    @user = @user.as_json(methods: [:full_name])

    render :show_common
  end
end
