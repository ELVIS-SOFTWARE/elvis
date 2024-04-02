class ActivityInstanceController < ApplicationController
  module RoomMode
    SINGULAR = 0
    FOLLOWING = 1
    ALL = 2
  end

  def update_all
    time_interval = TimeInterval.find(params[:time_interval_id])
    new_time_intervals = time_interval.generate_for_rest_of_season.select { |i| i[:start] != time_interval.start || i[:end] != time_interval.end }

    instance = ActivityInstance.find(params[:id])
    instances_to_update = instance.activity.activity_instances.select { |instance| instance.time_interval.start > time_interval.start }

    instances_to_check = instances_to_update

    new_time_intervals.each do |new_time_interval|
      # For each instance, we need to find the time_interval that is the same week
      corresponding_activity_instance = instances_to_update.select { |activity_instance| activity_instance.time_interval.start.strftime("%U") == new_time_interval[:start].strftime("%U") }.first

      if corresponding_activity_instance.nil?
        new_interval = TimeInterval.create(start: new_time_interval[:start], end: new_time_interval[:end], kind: 'c', is_validated: true)
        corresponding_activity_instance = ActivityInstance.create(time_interval: new_interval, room: instance.room, location: instance.location, activity: instance.activity)
        instances_to_check << corresponding_activity_instance
      end

      ti = corresponding_activity_instance.time_interval
      ti.change_start_and_end(new_time_interval[:start], new_time_interval[:end])
      ti.save
    end

    #  Check conflicts for updated intervals
    results = { conflicts: [], success: 0 }

    instances_to_check.each do |instance|
      if instance.check_for_conflict
        c = instance.check_for_conflict
        results[:conflicts] << c
      else
        results[:success] += 1
      end
    end

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

    case params[:room_mode]
    when RoomMode::FOLLOWING

      instances = instance
                    .activity
                    .activity_instances
                    .joins(:time_interval)
                    .where("time_intervals.start >= ?", instance.time_interval.start)
                    .each { |i| i.update(permitted_params) }
    when RoomMode::ALL
      instances = instance
                    .activity
                    .activity_instances
                    .update_all(permitted_params.to_h)

      instance.activity.update!(params.permit(:room_id, :location_id))
    else

      if params[:startTime].present?
        instance.time_interval.update!(start: instance.time_interval.start.change(hour: params[:startTime].split(":")[0], min: params[:startTime].split(":")[1]))
      end
      if params[:endTime].present?
        instance.time_interval.update!(end: instance.time_interval.end.change(hour: params[:endTime].split(":")[0], min: params[:endTime].split(":")[1]))
      end

      instance.update!(permitted_params)
    end

    if instance.activity && params[:evaluation_level_ref_id].present?
      instance.activity.update!(evaluation_level_ref_id: params[:evaluation_level_ref_id])
    end

    instance.change_teacher(params[:teacher_id]) if params[:teacher_id].present?
    instance.activity.change_teacher(instance.teacher.id, params[:teacher_id])
    instance.change_cover_teacher(params[:cover_teacher_id])

    render json: instance
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
end
