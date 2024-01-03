module Seasons
  # ajoute les jours fériés à la saison
  class PopulateHolidays
    def initialize(season: nil, bank_holidays_zone: nil, academie: nil, school_zone: nil, address: nil)
      @season = season
      @zone = bank_holidays_zone
      @academie = academie
      @school_zone = school_zone
      @address = address
      validate!
    end

    def execute
      season_start = @season.start
      season_end = @season.end

      @season.holidays = ({}) unless @season.holidays

      #=============== JOURS FERIES
      # on récupère les jours fériés de l'année n et on les filtre
      bhs = Holidays::BankHolidays.new(season_start.year, @zone)
                                  .fetch_bank_holidays
                                  .select do |j|
        j[:date] <= season_end && j[:date] >= season_start
      end

      # et on les ajoute aux vacances de la saison
      merge_bank_holidays_array bhs, "bank"

      if season_end.year > season_start.year
        # on récupère les jours fériés de l'année n+1 et on les filtre
        bhs = Holidays::BankHolidays.new(season_end.year, @zone)
                                    .fetch_bank_holidays
                                    .select do |j|
          j[:date] <= season_end && j[:date] >= season_start
        end

        # et on les ajoute aux vacances de la saison
        merge_bank_holidays_array bhs, "bank"
      end

      #=============== VACANCES SCOLAIRES
      # on récupère les vacances scolaires de l'année n et on les filtre
      sh_object = Holidays::SchoolHolidays.new(season_start.year, @academie, @school_zone, @address)

      shs = sh_object.fetch_school_holidays
      # pp shs
      # [{:start_date=>"2020-10-16T22:00:00+00:00",
      #   :end_date=>"2020-11-01T23:00:00+00:00",
      #   :label=>"Vacances de la Toussaint"},
      #  {:start_date=>"2020-12-18T23:00:00+00:00",
      #   :end_date=>"2021-01-03T23:00:00+00:00",
      #   :label=>"Vacances de Noël"},
      #  {:start_date=>"2021-02-19T23:00:00+00:00",
      #   :end_date=>"2021-03-07T23:00:00+00:00",
      #   :label=>"Vacances d'Hiver"},
      #  {:start_date=>"2021-02-19T23:00:00+00:00",
      #   :end_date=>"2021-03-07T23:00:00+00:00",
      #   :label=>"Vacances d'Hiver"},
      #  {:start_date=>"2021-04-09T22:00:00+00:00",
      #   :end_date=>"2021-04-25T22:00:00+00:00",
      #   :label=>"Vacances de Printemps"},
      #  {:start_date=>"2021-05-12T22:00:00+00:00",
      #   :end_date=>"2021-05-16T22:00:00+00:00",
      #   :label=>"Pont de l'Ascension"},
      #  {:start_date=>"2021-05-12T22:00:00+00:00",
      #   :end_date=>"2021-05-16T22:00:00+00:00",
      #   :label=>"Pont de l'Ascension"},
      #  {:start_date=>"2021-07-05T22:00:00+00:00",
      #   :end_date=>"2021-08-31T22:00:00+00:00",
      #   :label=>"Vacances d'Été"},
      #  {:start_date=>"2021-07-05T22:00:00+00:00",
      #   :end_date=>"2021-08-31T22:00:00+00:00",
      #   :label=>"Vacances d'Été"},
      #  {:start_date=>"2021-07-05T22:00:00+00:00",
      #   :end_date=>"2021-08-31T22:00:00+00:00",
      #   :label=>"Vacances d'Été"}]

      shs.select! do |j|
        j[:start_date] <= season_end && j[:end_date] >= season_start
      end

      # pp shs
      # [{:start_date=>"2020-10-16T22:00:00+00:00",
      #   :end_date=>"2020-11-01T23:00:00+00:00",
      #   :label=>"Vacances de la Toussaint"},
      #  {:start_date=>"2020-12-18T23:00:00+00:00",
      #   :end_date=>"2021-01-03T23:00:00+00:00",
      #   :label=>"Vacances de Noël"},
      #  {:start_date=>"2021-02-19T23:00:00+00:00",
      #   :end_date=>"2021-03-07T23:00:00+00:00",
      #   :label=>"Vacances d'Hiver"},
      #  {:start_date=>"2021-02-19T23:00:00+00:00",
      #   :end_date=>"2021-03-07T23:00:00+00:00",
      #   :label=>"Vacances d'Hiver"},
      #  {:start_date=>"2021-04-09T22:00:00+00:00",
      #   :end_date=>"2021-04-25T22:00:00+00:00",
      #   :label=>"Vacances de Printemps"},
      #  {:start_date=>"2021-05-12T22:00:00+00:00",
      #   :end_date=>"2021-05-16T22:00:00+00:00",
      #   :label=>"Pont de l'Ascension"},
      #  {:start_date=>"2021-05-12T22:00:00+00:00",
      #   :end_date=>"2021-05-16T22:00:00+00:00",
      #   :label=>"Pont de l'Ascension"}]

      # et on les ajoute aux vacances de la saison
      merge_school_holidays_array shs, "school"
    end

    private

    def number?(string)
      true if Float(string)
    rescue StandardError
      false
    end

    # valide les arguments
    def validate!
      raise ArgumentError, "Invalid season" if @season.nil? || @season.start.nil? || @season.end.nil?

      raise ArgumentError, "Invalid zone" if @zone.nil?

      # erreur si on n'a ni académie, ni zone scolaire, ni addresse
      if @academie.nil? && @school_zone.nil? && @address.nil?
        raise ArgumentError,
              "Invalid arguments - need one of academie, school_zone or address"
      end
    end

    # fusionne le tableau passé en argument avec celui des saisons, en évitant les doublons
    def merge_bank_holidays_array(holiday_array, kind)
      holiday_array.map do |holiday|
        next if @season.holidays.exists?({ date: holiday[:date], label: holiday[:label], kind: kind })

        @season.holidays << Holiday.new(date: holiday[:date], label: holiday[:label],
                                        kind: kind)
      end
    end

    # fusionne le tableau passé en argument avec celui des saisons, en évitant les doublons
    def merge_school_holidays_array(holiday_array, kind)
      # pour chaque vacance
      holiday_array.map do |holiday|
        # pp "holiday #{holiday}"

        # on ajoute chaque jour

        start_date = holiday[:start_date].to_date
        end_date = holiday[:end_date].to_date
        label = holiday[:label]

        (start_date..(end_date - 1.day)).each do |date|
          # pp "#{date} ajoutée ?"

          next if @season.holidays.exists?({ date: date, label: label, kind: kind })

          h = Holiday.new(date: date, label: label, kind: kind)
          # pp h
          @season.holidays << h
          # pp " -> oui !"
        end
      end
    end
  end
end
