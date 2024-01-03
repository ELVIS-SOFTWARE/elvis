class ScriptsController < ApplicationController

  before_action -> { @current_user = current_user }

  USER_DATA_TO_COPY = [
    { name: "first_name", value: 1 }.freeze,
    { name: "last_name", value: 2 }.freeze,
    { name: "email", value: 4 }.freeze,
    { name: "birthday", value: 8 }.freeze,
    { name: "address_ids", value: 16 }.freeze,
    { name: "is_teacher", value: 32 }.freeze
  ].freeze

  def merge_users
    #  TODO analyser l'impact de la modification de déf de Season.current (ne renvoie plus un tableau d'un seul élément mais renvoie désormais le 1er (et seul) élément de ce tableau)
    @season = Season.current
  end

  def fix_activities_holidays
    #  TODO analyser l'impact de la modification de déf de Season.current (ne renvoie plus un tableau d'un seul élément mais renvoie désormais le 1er (et seul) élément de ce tableau)
    @season = Season.current
  end

  def replicate_week_activities
    #
  end

  def execute_merge_users
    user_to_delete = User.find params[:old_user_id]
    saved_user = User.find params[:saved_user_id]
    delete_old = params[:delete] == true

    raise StandardError, "l'un des deux utilisateurs n'existe pas." if user_to_delete.nil? || saved_user.nil?

    respond_to do |format|
      format.json do
        Users::MergeUsers.new(saved_user, user_to_delete, with_delete: delete_old).execute

        if !delete_old && user_to_delete.is_teacher && user_to_delete.planning.nil?
          user_to_delete.planning = Planning.new
        end

        selected_data = params[:dataToSave]

        if selected_data == -2
          USER_DATA_TO_COPY.each do |data|
            saved_user[data[:name]] = user_to_delete[data[:name]]
          end

          saved_user.save!

        elsif selected_data.positive?
          USER_DATA_TO_COPY.reverse.each do |data|
            next unless selected_data >= data[:value]

            selected_data -= data[:value]

            if data[:name] == "address_ids"
              saved_user.address_ids = user_to_delete.address_ids
            else
              saved_user[data[:name]] = user_to_delete[data[:name]]
            end
          end

          saved_user.save!
        end

        render json: {}
      end
    end
  end

  def execute_replicate_activities
    dates_str = params[:dates]
    script_to_use = params[:stu] == true
    replicate_on_vac = params[:rov] == true

    replicate = Scripts::ReplicateActivities.new(replicate_on_vac, dates_str)

    if script_to_use
      replicate.execute_with_first_week
    else
      replicate.execute_with_last_week
    end

    render json: {}
  end

  def execute_replicate_week_activities
    replicate_on_vac = params[:rov] == true
    ref_week_date = params[:refWeekDate]
    target_date_start = params[:targetStartDate]
    target_date_end = params[:targetEndDate]

    begin

      job = Scripts::ReplicateWeekActivities.perform_later(replicate_on_vac, ref_week_date, target_date_start, target_date_end)


    rescue StandardError, NoMemoryError => e
      render json: { errors: e }, status: 500
      return
    end

    render json: {jobId: job.job_id}
  end

  def get_job_status
    job_id = params[:jobId]
    status = ActiveJob::Status.get(job_id)

    render json: {jobStatus: status.read}
  end
end
