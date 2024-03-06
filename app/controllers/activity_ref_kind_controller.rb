class ActivityRefKindController < ApplicationController
  before_action -> { @current_user = current_user }

  def index

    respond_to do |format|
      format.html 

      format.json do
          render json: @activity_ref_kinds.as_json(
              except: [:created_at, :updated_at, :deleted_at])
      end
    end
  end

  def list
    query = ActivityRefKind.all.order(:name)

    respond_to do |format|
      format.json { render json: { status:query.as_json, pages:1, total:1} }
    end
  end

  def create
    name = activity_ref_kind_params[:name]
    is_for_child = activity_ref_kind_params[:is_for_child]

    kind = ActivityRefKind.new name: name, is_for_child: is_for_child

    begin
      kind.save!

      respond_to do |format|
        format.html { redirect_to activity_ref_kind_index_path }
        format.json { render json: { message: "ok", value: kind }, status: :ok }
      end
    rescue StandardError => _e
      respond_to do |format|
        format.html { redirect_to new_activity_ref_kind_path(error: kind.errors.full_messages) }
        format.json { render json: { message: kind.errors.full_messages }, status: :internal_server_error }
      end
    end
  end

  def new
    @activity_ref_kind = ActivityRefKind.new
    @errors = params[:error]
  end

  def destroy
    kind = ActivityRefKind.find params[:id]
    activities_ref = ActivityRef.where(activity_ref_kind_id: kind.id)

    begin
      if activities_ref.empty?
        kind.destroy!

        respond_to do |format|
          format.html { redirect_to activity_ref_kind_index_path }
          format.json { render json: { message: "ok" }, status: :ok }
        end
      else
        activities_ref = activities_ref.pluck(:label)
        activities_ref = activities_ref.take(2).join(", ") + "..." if activities_ref.length > 2

        respond_to do |format|
          format.json { render json: { message: "Vous ne pouvez pas supprimer cette famille car des activités y sont attachées", activities: activities_ref}, status: :internal_server_error }
          end
      end
    rescue StandardError => e
      kind.errors[:base] << e.message.to_s

      respond_to do |format|
        format.html { redirect_to edit_activity_ref_kind_path(kind, error: kind.errors.full_messages) }
        format.json { render json: { message: kind.errors.full_messages }, status: :internal_server_error }
      end
    end
  end

  def update
    kind = ActivityRefKind.find params[:id]

    name = activity_ref_kind_params[:name]
    is_for_child = activity_ref_kind_params[:is_for_child]

    begin
      kind.name = name
      kind.is_for_child = is_for_child
      kind.save!
    rescue StandardError => e
      redirect_to edit_activity_ref_kind_path(kind, error: instrument.errors.full_messages)
    end

    redirect_to activity_ref_kind_index_path
  end

  def edit
    @activity_ref_kind = ActivityRefKind.find params[:id]
    @errors = params[:error]
  end

  private

  def activity_ref_kind_params
    params.require(:activity_ref_kind).permit(:name, :is_for_child)
  end
end
