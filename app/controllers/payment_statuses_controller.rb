class PaymentStatusesController < ApplicationController

  before_action :set_current_user
  before_action -> { authorize! :manage, PaymentStatus }
  before_action -> { render status:401, json:{error: "forbidden"} and return }, if: -> { PaymentStatus::BUILTIN_IDS.include?(params[:id].to_i) }, only: [:edit, :update, :destroy]

  def index
    @payment_statuses = PaymentStatus.all
  end

  def new
    @payment_status = PaymentStatus.new
  end

  def create
    payment_status = PaymentStatus.new payment_statuses_params
    payment_status.save!

    redirect_to "#{parameters_payment_parameters_path}#tab-1"
  end

  def destroy
    payment_status = PaymentStatus.find params[:id]

    payment_status&.destroy

    respond_to do |format|
      format.json { render json: payment_status }
      format.html { redirect_to payment_statuses_path }
    end
  end

  def edit
    @payment_status = PaymentStatus.find params[:id]
  end

  def update
    local_params = payment_statuses_params

    payment_status = PaymentStatus.find params[:id]

    payment_status.label = local_params[:label]
    payment_status.color = local_params[:color]

    payment_status.save!

    redirect_to "#{parameters_payment_parameters_path}#tab-1"
  end

  private

  def payment_statuses_params
    params.require(:payment_status).permit(:label, :color, :id)
  end
end
