# frozen_string_literal: true
module LiquidDrops
  class ApplicationDrop < Liquid::Drop

    def initialize(application)
      @application = application
    end

    def id
      @application["id"]
    end

    def user_id
      @application["user_id"]
    end

    def email
      @application["user"]["email"]
    end

    def first_name
      @application["user"]["first_name"]
    end

    def last_name
      @application["user"]["last_name"]
    end

    def birthday
      @application["user"]["birthday"]
    end

    def adherent_number
      @application["user"]["adherent_number"]
    end

    def start
      @application["season"]["start"]
    end

    def end
      @application["season"]["end"]
    end

    def season_label
      @application["season"]["label"]
    end

    def total_due_payments
      "woop woop"
    end

  end
end

