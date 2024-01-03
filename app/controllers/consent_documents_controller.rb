class ConsentDocumentsController < ApplicationController
  before_action -> { @current_user = current_user }

  def index
    authorize! :manage, ConsentDocument

    render json: jsonize_consent_document_query(ConsentDocument.all.order(:index))
  end

  def create
    authorize! :manage, ConsentDocument

    has_attached_file =
      params[:attached_file] &&
        params[:attached_file] != "undefined" &&
        MimeMagic.by_magic(File.open(params[:attached_file])).type == "application/pdf"

    begin
      p = flat_consent_document_params
      p[:index] = (ConsentDocument.maximum(:index) || 0) + 1
      document = ConsentDocument.create! p

      if has_attached_file
        document.attached_file.attach(params[:attached_file])
      end

      render status: :created,
             json: jsonize_consent_document_query(document)
    rescue StandardError => e
      render status: :unprocessable_entity,
             json: { error: document&.errors.as_json }
    end
  end

  def show
    authorize! :manage, ConsentDocument

    render json: jsonize_consent_document_query(ConsentDocument.find(params[:id]))
  end

  def update
    document = ConsentDocument.find(params[:id])
    authorize! :manage, document

    has_attached_file =
      params[:attached_file] &&
        params[:attached_file] != "undefined" &&
        MimeMagic.by_magic(File.open(params[:attached_file])).type == "application/pdf"

    begin

      document.update! flat_consent_document_params

      if params[:attached_file_has_changed] == "true"
        if has_attached_file
          document.attached_file.attach(params[:attached_file])
        else
          document.attached_file.purge
        end
      end

      render status: :ok, json: jsonize_consent_document_query(document)
    rescue ActiveRecord::RecordInvalid => e
      render status: :unprocessable_entity,
             json: { errors: [e.message] }
    rescue StandardError => e
      render status: :internal_server_error,
             json: { errors: "update failed : #{e}" }
    end
  end

  def destroy
    document = ConsentDocument.find(params[:id])
    authorize! :manage, document

    begin
      document.destroy

    rescue StandardError => e
      render status: :unprocessable_entity,
             json: { error: "deletion failed" }
      return
    end

    head :no_content
  end

  def move_up
    authorize! :manage, ConsentDocument

    doc_to_move_up = ConsentDocument.find(params[:id])
    return if doc_to_move_up.index==1

    doc_to_move_down = ConsentDocument.find_by(index: doc_to_move_up.index-1)

    doc_to_move_down.index += 1
    doc_to_move_up.index -= 1

    doc_to_move_down.save!
    doc_to_move_up.save!

    render json: jsonize_consent_document_query(ConsentDocument.all.order(:index))
  end

  def move_down
    authorize! :manage, ConsentDocument

    doc_to_move_down = ConsentDocument.find(params[:id])
    return if doc_to_move_down.index==ConsentDocument.maximum(:index)

    doc_to_move_up = ConsentDocument.find_by(index: doc_to_move_down.index+1)

    doc_to_move_down.index += 1
    doc_to_move_up.index -= 1

    doc_to_move_down.save!
    doc_to_move_up.save!

    render json: jsonize_consent_document_query(ConsentDocument.all.order(:index))
  end

  def has_consented
    consent_document_user = ConsentDocumentUser.find_by(consent_document_id: params[:id], user_id: params[:user_id])

    render json: { has_consented: consent_document_user&.has_consented || false }
  end

  private

  def consent_document_params
    params.require(:consent_document).permit(
      :id,
      :index,
      :title,
      :content,
      :attached_file,
      :expected_answer
    )
  end

  def flat_consent_document_params
    params.permit(
      :index,
      :title,
      :content,
      :expected_answer,
    )
  end

  def jsonize_consent_document_query(query)
    ConsentDocument.jsonize_consent_document_query(query)
  end
end