# frozen_string_literal: true
module LiquidDrops
  class ActivityInstanceDrop < Liquid::Drop
    def initialize(activity_instance)
      @activity_instance = activity_instance
    end

    def id
      @activity_instance["id"]
    end

    # time_interval data
    def start_date
      I18n.l(DateTime.parse(@activity_instance["time_interval"]["start"]), format: "%A %d %B")
    end

    def activity_start
      DateTime.parse(@activity_instance["time_interval"]["start"]).strftime("%H:%M")
    end

    def activity_end
      DateTime.parse(@activity_instance["time_interval"]["end"]).strftime("%H:%M")
    end

    #  activity data
    def label
      @activity_instance["activity"]["activity_ref"]["label"]
    end

    def teacher_last_name
      @activity_instance["activity"]["teacher"]["last_name"]
    end

    def teacher_first_name
      @activity_instance["activity"]["teacher"]["first_name"]
    end

  end
end
