class ActivityInstanceController < ApplicationController
  module InstancesUpdateScope
    SINGULAR = 0
    FOLLOWING = 1
    ALL = 2
  end

  def update_all
    instances_to_check = Activities::TimeIntervalUpdater.new(params[:id], params[:time_interval_id]).execute
    results = Activities::ConflictsChecker.new(instances_to_check).execute

    tis = instances_to_check.map { |instance| instance.time_interval }

    #  Return results
    render json: { intervals: ActiveModel::SerializableResource.new(tis, each_serializer: TimeIntervalSerializer), success: results[:success], conflicts: results[:conflicts] }
  end

  def change_teacher
    @activity_instance = ActivityInstance.find(params[:id])

  end

  def set_cover_teacher
    @instance = ActivityInstance.find(params[:id])
    cover_teacher = User.find_by(id: params[:cover_teacher_id])

  end

  def edit_activity_instance
    instance = ActivityInstance.includes(activity: :activity_instances).find(params[:id])

    begin
      old_time_interval = instance.time_interval
      new_time_interval_array = {
        startTime: params[:startTime]&.split(":").present? ? params[:startTime]&.split(":") : [],
        endTime: params[:endTime]&.split(":").present? ? params[:endTime]&.split(":") : [],
        date: params[:startDate]&.split("-").present? ? params[:startDate]&.split("-") : []
      }

      new_time_interval = build_new_time_interval(new_time_interval_array, old_time_interval)
    rescue => error
      @error_message = error.message
    end

    case params[:instances_update_scope]
    when InstancesUpdateScope::FOLLOWING
      instances = instance
                    .activity
                    .activity_instances
                    .joins(:time_interval)
                    .where("time_intervals.start >= ?", instance.time_interval.start)
                    .each { |i| i.update(permitted_params) }

      if new_time_interval.present?
        instance.time_interval.update!(new_time_interval)
        following_instances_to_update = Activities::TimeIntervalUpdater.new(instance.id, instance.time_interval.id).execute
        conflicts_results = Activities::ConflictsChecker.new(following_instances_to_update).execute
      end

    when InstancesUpdateScope::ALL
      instances = instance
                    .activity
                    .activity_instances
                    .update_all(permitted_params.to_h)

      instance.activity.update!(params.permit(:room_id, :location_id))
    else
      instance.time_interval.update!(new_time_interval) if new_time_interval.present?
      instance.update!(permitted_params)
    end

    if instance.activity && params[:evaluation_level_ref_id].present?
      instance.activity.update!(evaluation_level_ref_id: params[:evaluation_level_ref_id])
    end

    instance.change_teacher(params[:teacher_id]) if params[:teacher_id].present?
    instance.activity.change_teacher(instance.teacher.id, params[:teacher_id])
    instance.change_cover_teacher(params[:cover_teacher_id])


    render json: {
      instance: instance,
      error_message: @error_message,
      result: conflicts_results.present? ? conflicts_results : ""
    }
  end

  def bulkdelete

    a_param = params.permit(
      :activity_id,
      :instance_ids,
      :time_interval_ids
    )

    activity_instances = ActivityInstance.where(id: a_param[:instance_ids].split(","))

    if activity_instances
      activity_instances.destroy_all
    end

    instancesLeft = ActivityInstance.where(activity_id: a_param[:activity_id]).count > 0

    if !instancesLeft

      activity = Activity.find(a_param[:activity_id])
      teacher = activity.teacher

      activity&.destroy

      time_intervals = TimeInterval.where(id: a_param[:time_interval_ids])
      season = Season.from_interval(time_intervals.first).first
      time_intervals&.update_all(is_validated: false)

      Activities::AssignGroupsNames
        .new(teacher, season)
        .execute
    end

    render json: activity_instances
  end

  def delete
    activity_instance = ActivityInstance.includes(:time_interval).find params[:id]
    time_interval = activity_instance.time_interval
    time_interval.is_validated = false

    time_interval.save!
    activity_instance.destroy!

    render json: time_interval
  end

  private

  def permitted_params
    params.permit(:room_id, :location_id, :are_hours_counted)
  end

  def build_new_time_interval(new_time_interval_array, old_time_interval)
    new_time_interval = {}

    time_keys = [:date, :startTime, :endTime]
    time_keys.each do |key|
      if new_time_interval_array[key].empty?
        case key
        when :date
          new_time_interval_array[key].push(old_time_interval.start.year, old_time_interval.start.month, old_time_interval.start.day)
        when :startTime
          new_time_interval_array[key].push(old_time_interval.start.hour, old_time_interval.start.min)
        when :endTime
          new_time_interval_array[key].push(old_time_interval.end.hour, old_time_interval.end.min)
        else
          raise ArgumentError, "La clé #{key} n'est pas reconnue."
        end
      end
    end

    # build the new time interval
    new_time_interval.merge!({
                               start: Time.zone.local(*new_time_interval_array[:date], *new_time_interval_array[:startTime]),
                               end: Time.zone.local(*new_time_interval_array[:date], *new_time_interval_array[:endTime]),
                               kind: 'c',
                               is_validated: true
                             })

    # Check if the new time interval is valid
    if new_time_interval[:start] > new_time_interval[:end]
      raise ArgumentError, "L'heure de début doit être postérieure à l'heure de fin."
    end
    if new_time_interval[:start].strftime("%U") != old_time_interval.start.strftime("%U")
      raise ArgumentError, "La date doit être dans la même semaine que l'instance actuelle."
    end

    # Return the new time interval
    new_time_interval
  end

end

