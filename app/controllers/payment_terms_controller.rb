# frozen_string_literal: true

class PaymentTermsController < ApplicationController
  before_action :set_current_user
  before_action :get_all_paymentTermsIndexes
  before_action -> { @pricings = Pricing.all }, only: [:new, :edit]

  def index
    @payment_terms = PaymentTerms.all
    @activated = Parameter.get_value('payment_terms.activated')
    @display_text = Parameter.get_value('payment_step.display_text')

    respond_to do |format|
      format.json { render json: {
        data: @payment_terms,
        activated: @activated.present?, # present? return true if object is true and false if null or false
        display_text: @display_text,
        index: @payment_terms.pluck(:index)
      }, status: :ok }
    end

  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def destroy
    @payment_term = PaymentTerms.find(params[:id])
    @payment_term.index = nil
    @payment_term.save!
    @payment_term.destroy!

    respond_to do |format|
      format.json { render json: { message: "Payment term deleted" }, status: :ok }
    end

  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def new
    @submit_url = payment_terms_path
    @http_method = :post
  end

  def create
    @payment_term = PaymentTerms.new(payment_term_params)
    @payment_term[:index] = (PaymentTerms.maximum(:index) || 0) + 1
    @payment_term.save!

    respond_to do |format|
      format.json { render json: { message: "Payment term created" }, status: :ok }
    end

  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def edit
    @payment_term = PaymentTerms.find(params[:id])

    @submit_url = payment_term_path(@payment_term)
    @http_method = :patch
  end

  def update
    @payment_term = PaymentTerms.find(params[:id])

    @payment_term.update!(payment_term_params)

    respond_to do |format|
      format.json { render json: { message: "Payment term updated" }, status: :ok }
    end

  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def change_activated_param
    @activated = Parameter.find_by(label: 'payment_terms.activated')

    if @activated.present?
      @activated.update!(value: params[:activated].to_s)
    else
      Parameter.create!(label: 'payment_terms.activated', value: params[:activated].to_s, value_type: "boolean")
    end

    respond_to do |format|
      format.json { render json: {activated: params[:activated]}, status: :ok }
    end

  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def change_term_display_text_param
    @display_text = Parameter.find_by(label: 'payment_step.display_text')

    if @display_text.present?
      @display_text.update!(value: params[:display_text])
    else
      Parameter.create!(label: 'payment_step.display_text', value: params[:display_text], value_type: "string")
    end
  end

  # Enhanced version of @author: Xavier Maquignon #
  def move_up
    doc_to_move_up = PaymentTerms.find(params[:id])
    return if doc_to_move_up.index==PaymentTerms.minimum(:index)

    move_up_index = find_nearest_smaller_number(get_all_paymentTermsIndexes, doc_to_move_up.index)
    doc_to_move_down = PaymentTerms.find_by(index: move_up_index)

    doc_to_move_down.index = doc_to_move_up.index
    doc_to_move_up.index = move_up_index

    doc_to_move_down.save!
    doc_to_move_up.save!

    render json: jsonize_payment_terms_query(PaymentTerms.all.order(:index))
  end

  def move_down
    doc_to_move_down = PaymentTerms.find(params[:id])
    return if doc_to_move_down.index==PaymentTerms.maximum(:index)

    move_down_index = find_nearest_greater_number(get_all_paymentTermsIndexes, doc_to_move_down.index)
    doc_to_move_up = PaymentTerms.find_by(index: move_down_index)

    doc_to_move_up.index = doc_to_move_down.index
    doc_to_move_down.index = move_down_index

    doc_to_move_down.save!
    doc_to_move_up.save!

    render json: jsonize_payment_terms_query(PaymentTerms.all.order(:index))
  end

  private

  def get_all_paymentTermsIndexes
    PaymentTerms.all.pluck(:index)
  end

  private

  def payment_term_params
    params.require(:payment_term).permit(:pricing_id, :label, :terms_number, collect_on_months: [], days_allowed_for_collection: [])
  end

  def jsonize_payment_terms_query(query)
    PaymentTerms.jsonize_payment_terms_query(query)
  end

  def find_nearest_smaller_number(arr, target)
    closest_number = nil

    arr.each do |number|
      if number < target && (closest_number.nil? || (target - number) < (target - closest_number))
        closest_number = number
      end
    end

    closest_number
  end

  def find_nearest_greater_number(arr, target)
    closest_number = nil

    arr.each do |number|
      if number > target && (closest_number.nil? || (number - target) < (closest_number - target))
        closest_number = number
      end
    end

    closest_number
  end
end
