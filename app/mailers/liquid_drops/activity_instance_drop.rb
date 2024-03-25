# frozen_string_literal: true

class ActivityInstanceDrop
  def initialize(activity_instance)
    @activity_instance = activity_instance
  end

  def id
    @activity_instance["id"]
  end

  def start_date
    I18n.l(DateTime.parse(@activity_instance["time_interval"]["start"]), format: "%A %d %M")
  end

  def start_time
    DateTime.parse(@activity_instance["time_interval"]["start"]).strftime("%H:%M")
  end

  def end_time
    DateTime.parse(@activity_instance["time_interval"]["end"]).strftime("%H:%M")
  end

end
