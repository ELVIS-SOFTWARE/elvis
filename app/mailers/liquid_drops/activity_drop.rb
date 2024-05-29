# frozen_string_literal: true
module LiquidDrops
  class ActivityDrop < Liquid::Drop

    def initialize(activity)
      @activity = activity
    end

    def id
      @activity["id"]
    end

    def label
      @activity["activity_ref"]["label"]
    end

    def display_name
      @activity["activity_ref"]["display_name"]
    end

    def refKind
      @activity["activity_ref"]["kind"]
    end

    def activity_ref_kind_id
      @activity["activity_ref"]["activity_ref_kind_id"]
    end

    def occupation_limit
      @activity["activity_ref"]["occupation_limit"]
    end

    def monthly_price
      @activity["activity_ref"]["monthly_price"]
    end

    def quarterly_price
      @activity["activity_ref"]["quarterly_price"]
    end

    def annual_price
      @activity["activity_ref"]["annual_price"]
    end

    def from_age
      @activity["activity_ref"]["from_age"]
    end

    def to_age
      @activity["activity_ref"]["to_age"]
    end

    def teacher_email
      @activity["teacher"]["email"]
    end

    def teacher_first_name
      @activity["teacher"]["first_name"]
    end

    def teacher_last_name
      @activity["teacher"]["last_name"]
    end

    def room_label
      @activity["room"]["label"]
    end

    def room_kind
      @activity["room"]["kind"]
    end

    def activity_start
      DateTime.parse(@activity["time_interval"]["start"]).strftime("%H:%M")
    end

    def activity_end
      DateTime.parse(@activity["time_interval"]["end"]).strftime("%H:%M")
    end

    def startDate
      I18n.l(DateTime.parse(@activity["time_interval"]["end"]), format: "%A %d ")
    end

  end
end

