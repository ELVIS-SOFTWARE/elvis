class PaymentMethodController < ApplicationController

  before_action :set_current_user
  before_action -> { render status: 401, json: {error: "forbidden"} and return },
                if: -> { PaymentMethod::BUILTIN_IDS.include?(params[:id].to_i) },
                only: [:destroy]

  def index
    @payment_methods = PaymentMethod.all

    respond_to do |format|
      format.json { render json: {
        data: @current_user.is_admin ? @payment_methods : @payment_methods.where(show_payment_method_to_user: true).select(:id, :label).as_json(only: [:id, :label]),
      }}

      format.html
    end
  end

  def edit
    @payment_method = PaymentMethod.find params[:id]
  end

  def new
    @payment_method = PaymentMethod.new
  end

  def update
    local_params = payment_method_params
    payment_method = PaymentMethod.find params[:id]

    unless payment_method.built_in
      payment_method.label = local_params[:label]
      payment_method.is_special = local_params[:is_special]
      payment_method.is_credit_note = local_params[:is_credit_note]
    end

    payment_method.show_payment_method_to_user = local_params[:show_payment_method_to_user]

    payment_method.save!

    redirect_to "#{parameters_payment_parameters_url}#tab-1"
  end

  def create
    payment_method = PaymentMethod.new payment_method_params

    payment_method.save!

    redirect_to "#{parameters_payment_parameters_url}#tab-1"
  end

  def destroy
    payment_method = PaymentMethod.find params[:id]

    payment_method&.destroy

    respond_to do |format|
      format.json { render json: payment_method }
      format.html { redirect_to payment_method_index_path }
    end
  end

  private

  def payment_method_params
    params.require(:payment_method).permit(:label, :is_special, :is_credit_note, :show_payment_method_to_user)
  end
end
