class InstrumentsController < ApplicationController

  before_action -> { @current_user = current_user }

  def index
    @instruments = Instrument.all

    respond_to do |format|
      format.html
      format.json { render json: @instruments.as_json }
    end
  end

  def list
    query = Instrument.all

    respond_to do |format|
      format.json { render json: { status:query.as_json, pages:1, total:1} }
    end
  end

  def new
    @instrument = Instrument.new

    @errors = params[:error]
  end

  def create
    label = instrum_params[:label]

    instrument = Instrument.new label: label

    instrument.errors[:label] << "Le label ne peut être vide" if label.nil? || label.empty?

    begin
      raise StandardError unless instrument.errors.empty?

      instrument.save!

      redirect_to "#{instruments_path}#tab-6"
    rescue StandardError => e
      redirect_to new_instrument_path(error: instrument.errors.full_messages)
    end
  end

  def destroy
    instrument = Instrument.find params[:id]

    begin
      instrument.destroy!

      respond_to do |format|
        format.html { redirect_to instruments_path }
        format.json { render json: instrument, status: :ok }
      end
    rescue StandardError => e
      instrument.errors[:base] << e.message.to_s

      respond_to do |format|
        format.html { redirect_to edit_instrument_path(instrument, error: instrument.errors.full_messages) }
        format.json { render json: e.message, status: :internal_server_error }
      end
    end
  end

  def edit
    @instrument = Instrument.where(id: params[:id]).first

    @errors = params[:error]
  end

  def update
    instrument = Instrument.find params[:id]

    instrument.label = instrum_params[:label]

    instrument.errors[:label] << "Le label ne peut être vide" if instrument.label.nil? || instrument.label.empty?

    begin
      raise StandardError unless instrument.errors.empty?

      instrument.save!

    rescue StandardError => e
      redirect_to edit_instrument_path(instrument, error: instrument.errors.full_messages)
    end

    redirect_to "#{instruments_path}#tab-6"
  end

  private

  def instrum_params
    params.require(:instrument).permit(:label, :id)
  end
end
