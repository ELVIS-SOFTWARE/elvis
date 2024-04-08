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

    start_time = params[:startTime]&.split(":")
    end_time = params[:endTime]&.split(":")
    start_date = params[:startDate]&.split("-")

    time_update = build_time_updates(instance, start_time, end_time)
    begin
      date_update = build_date_updates(instance, start_date)
    rescue => error
      @error_message = error.message
    end

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

      instance.time_interval.update!(time_update) if time_update.present?
      instance.time_interval.update!(date_update) if date_update.present?
      instance.update!(permitted_params)
    end

    if instance.activity && params[:evaluation_level_ref_id].present?
      instance.activity.update!(evaluation_level_ref_id: params[:evaluation_level_ref_id])
    end

    instance.change_teacher(params[:teacher_id]) if params[:teacher_id].present?
    instance.activity.change_teacher(instance.teacher.id, params[:teacher_id])
    instance.change_cover_teacher(params[:cover_teacher_id])

    render json: { instance: instance, error_message: @error_message }
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

  def build_time_updates(instance, start_time, end_time)
    time_update = {}

    start_interval = instance.time_interval.start
    end_interval = instance.time_interval.end
    start_time_obj = Time.zone.local(start_interval.year, start_interval.month, start_interval.day, start_time&.first, start_time&.second) if start_time.present?
    end_time_obj = Time.zone.local(end_interval.year, end_interval.month, end_interval.day, end_time&.first, end_time&.second) if end_time.present?

    if start_time.present? && start_time_obj > end_interval
      raise ArgumentError, "L'heure de début doit être postérieure à l'heure de fin actuelle."
    end

    if start_time.present? && end_time.present? && start_time_obj > end_time_obj
      raise ArgumentError, "L'heure de début doit être postérieure à l'heure de fin."
    end

    if end_time.present? && end_time_obj < start_interval
      raise ArgumentError, "L'heure de fin doit être postérieure à l'heure de début."
    end

    time_update[:start] = instance.time_interval.start.change(hour: start_time&.first, min: start_time&.second) if start_time_obj.present?
    time_update[:end] = instance.time_interval.end.change(hour: end_time&.first, min: end_time&.second) if end_time_obj.present?

    time_update
  end


  def build_date_updates(instance, start_date)
    date_update = {}

    if start_date.present?
      instance_date_obj = instance.time_interval.start
      current_week_start = instance_date_obj.beginning_of_week
      current_week_end = instance_date_obj.end_of_week
      start_date_obj = Time.zone.local(start_date&.first, start_date&.second, start_date&.third, instance_date_obj.hour, instance_date_obj.min, instance_date_obj.sec)

      if start_date_obj < current_week_start || start_date_obj > current_week_end
        raise ArgumentError, "La date doit être dans la même semaine que l'instance actuelle."
      else
        date_update[:start] = instance.time_interval.start.change(
          year: start_date&.first,
          month: start_date&.second,
          day: start_date&.third
        )
        date_update[:end] = instance.time_interval.end.change(
          year: start_date&.first,
          month: start_date&.second,
          day: start_date&.third
        )
      end

      date_update
    end

  end
end
