# frozen_string_literal: true

class PaymentScheduleOptionsController < ApplicationController
  before_action :set_current_user
  before_action :get_all_payment_schedule_option_indexes
  before_action -> { @pricing_categories = PricingCategory.all }, only: [:new, :edit]

  def index
    @payment_schedule_options = PaymentScheduleOptions.all
    @activated = Parameter.get_value('payment_terms.activated')
    @display_text = Parameter.get_value('payment_step.display_text')

    respond_to do |format|
      format.json { render json: {
        data: @payment_schedule_options,
        activated: @activated.present?, # present? return true if object is true and false if null or false
        display_text: @display_text,
        index: @payment_schedule_options.pluck(:index)
      }, status: :ok }
    end

  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def destroy
    @payment_schedule_option = PaymentScheduleOptions.find(params[:id])
    @payment_schedule_option.index = nil
    @payment_schedule_option.save!
    @payment_schedule_option.destroy!

    respond_to do |format|
      format.json { render json: { message: "Payment schedule option deleted" }, status: :ok }
    end

  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def new
    @submit_url = payment_schedule_options_path
    @http_method = :post
  end

  def create
    @payment_schedule_option = PaymentScheduleOptions.new(payment_schedule_option_params)
    @payment_schedule_option[:index] = (PaymentScheduleOptions.maximum(:index) || 0) + 1
    @payment_schedule_option.save!

    respond_to do |format|
      format.json { render json: { message: "Payment schedule option created" }, status: :ok }
    end

  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def edit
    @payment_schedule_option = PaymentScheduleOptions.find(params[:id])

    @submit_url = payment_schedule_option_path(@payment_schedule_option)
    @http_method = :patch
  end

  def update
    @payment_schedule_option = PaymentScheduleOptions.find(params[:id])

    @payment_schedule_option.update!(payment_schedule_option_params)

    respond_to do |format|
      format.json { render json: { message: "Payment schedule option updated" }, status: :ok }
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
    doc_to_move_up = PaymentScheduleOptions.find(params[:id])
    return if doc_to_move_up.index==PaymentScheduleOptions.minimum(:index)

    move_up_index = find_nearest_smaller_number(get_all_payment_schedule_option_indexes, doc_to_move_up.index)
    doc_to_move_down = PaymentScheduleOptions.find_by(index: move_up_index)

    doc_to_move_down.index = doc_to_move_up.index
    doc_to_move_up.index = move_up_index

    doc_to_move_down.save!
    doc_to_move_up.save!

    render json: jsonize_payment_schedule_options_query(PaymentScheduleOptions.all.order(:index))
  end

  def move_down
    doc_to_move_down = PaymentScheduleOptions.find(params[:id])
    return if doc_to_move_down.index==PaymentScheduleOptions.maximum(:index)

    move_down_index = find_nearest_greater_number(get_all_payment_schedule_option_indexes, doc_to_move_down.index)
    doc_to_move_up = PaymentScheduleOptions.find_by(index: move_down_index)

    doc_to_move_up.index = doc_to_move_down.index
    doc_to_move_down.index = move_down_index

    doc_to_move_down.save!
    doc_to_move_up.save!

    render json: jsonize_payment_schedule_options_query(PaymentScheduleOptions.all.order(:index))
  end

  private

  def get_all_payment_schedule_option_indexes
    PaymentScheduleOptions.all.pluck(:index)
  end

  private

  def payment_schedule_option_params
    params.require(:payment_schedule_option)
          .permit(
            :pricing_category_id,
            :label,
            :payments_number,
            payments_months: [],
            available_payments_days: []
          )

  end

  def jsonize_payment_schedule_options_query(query)
    PaymentScheduleOptions.jsonize_payment_schedule_options_query(query)
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
