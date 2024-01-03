module Holidays
  # zones valides pour la récupération des jours fériés

  # récupère les jours fériés de l'année civile en appelant l'API du gouvernement
  # zone doit être parmi : metropole alsace-moselle guadeloupe guyane la-reunion martinique
  #  mayotte nouvelle-caledonie polynesie-francaise saint-barthelemy
  #  saint-martin saint-pierre-et-miquelon wallis-et-futuna
  class BankHolidays
    ZONES = %w[metropole alsace-moselle guadeloupe guyane la-reunion martinique
               mayotte nouvelle-caledonie polynesie-francaise saint-barthelemy
               saint-martin saint-pierre-et-miquelon wallis-et-futuna]

    def initialize(year, zone)
      @zone = zone
      @year = year.to_i
      validate!
      @bank_holidays_url = "https://calendrier.api.gouv.fr/jours-feries/#{zone}/#{year}.json"
    end

    # Renvoie les jours fériés de l'année civile sous la forme d'un tableau [{:date => DateTime, :label => String}, etc...]
    # ou renvoie {} en cas d'erreur
    def fetch_bank_holidays
      uri = URI(@bank_holidays_url)
      begin
        response = Net::HTTP.get(uri)
        d = JSON.parse(response)
      rescue StandardError
        notify_airbrake(error)
        return {}
      end

      d.map { |d1, d2| { date: d1, label: d2 } }
    end

    def self.read_zone_parameter
      return Parameter.get_value("BANK_HOLIDAYS_ZONE")
    end

    private

    def validate!
      unless ZONES.include? @zone
        raise ArgumentError,
              "Invalid zone"
      end
    end
  end
end
