module Holidays
  # récupère les vacances de l'année scolaire en appelant l'API du gouvernement français
  class SchoolHolidays
    def self.fetch_academies_list
      contour_academies_url = "https://data.education.gouv.fr/api/records/1.0/search/?dataset=fr-en-contour-academies-2020&rows=50"

      uri = URI(contour_academies_url)
      begin
        response = Net::HTTP.get(uri)
        response_hash = JSON.parse(response)
      rescue StandardError
        return []
      end

      # on attend au moins un résultat
      return [] if response_hash["nhits"] == 0

      academies_hash = response_hash["records"]
      academies_list = []

      academies_hash.map do |aca|
        academies_list << aca["fields"]["name"]
      end
      academies_list
    end

    def self.fetch_zones_list(year)
      school_holidays_service_url = "https://data.education.gouv.fr/api/records/1.0/search/?dataset=fr-en-calendrier-scolaire&rows=1&facet=zones&refine.annee_scolaire=#{year}-#{year + 1}"

      uri = URI(school_holidays_service_url)
      begin
        response = Net::HTTP.get(uri)
        response_hash = JSON.parse(response)
      rescue StandardError
        return []
      end

      # on attend exactement un résultat
      return [] unless response_hash["records"].size == 1

      zones_hash = response_hash["facet_groups"][0]
      return [] unless zones_hash["name"] == "zones"

      zones_list = []

      zones_hash["facets"].map do |facet|
        zones_list << facet["name"]
      end
      zones_list
    end

    def self.fetch_all_zones
      school_holidays_service_url = "https://data.education.gouv.fr/api/records/1.0/search/?dataset=fr-en-calendrier-scolaire&rows=50&facet=zones"

      uri = URI(school_holidays_service_url)
      begin
        response = Net::HTTP.get(uri)
        response_hash = JSON.parse(response)
      rescue StandardError
        return []
      end

      zones_hash = response_hash["facet_groups"][0]
      zones_list = zones_hash["facets"].map {|facet| facet["name"]}


      zones_list
    end


    def self.fetch_academie_from_location(location)
      if location.nil?
        return nil
      end
      academies_service_url = "https://data.education.gouv.fr/api/records/1.0/search/?dataset=fr-en-contour-academies-2020&q=&geofilter.distance=#{location[0]}%2C+#{location[1]}%2C1"

      uri = URI(academies_service_url)
      begin
        response = Net::HTTP.get(uri)
        response_hash = JSON.parse(response)
      rescue StandardError
        return
      end

      # on attend un résultat et un seul
      return if response_hash["nhits"] != 1

      academie_hash = response_hash["records"][0]["fields"]
      academie_hash["name"]
    end

    def self.fetch_location_for_town(post_code, town_name)
      return if post_code.nil? && town_name.nil?

      geoloc_service_url = "https://geo.api.gouv.fr/communes?nom=#{town_name}&codePostal=#{post_code}&fields=nom,codesPostaux,centre&format=json&geometry=centre"

      uri = URI(geoloc_service_url)
      begin
        response = Net::HTTP.get(uri)
        response_hash = JSON.parse(response)
      rescue StandardError
        return
      end

      # on attend un résultat et un seul
      return if response_hash.size != 1

      geo_json_coords = response_hash[0]["centre"]["coordinates"]

      # geoJSON fournit la longitude en 1ère coord
      # donc, inverser les coordonnées
      [geo_json_coords[1], geo_json_coords[0]]
    end

    def self.fetch_location_for_address(address)
      # return if address.nil?

      address = CGI.escape address
      geoloc_service_url = "https://api-adresse.data.gouv.fr/search?q=#{address}"

      uri = URI(geoloc_service_url)

      begin
        response = Net::HTTP.get(uri)
        response_hash = JSON.parse(response)
      rescue StandardError
        return
      end

      # on attend au moins un résultat cohérent
      if response_hash.size == 0 || response_hash["features"].nil? || response_hash["features"][0]["properties"]["score"] < 0.5
        return
      end

      geo_json_coords = response_hash["features"][0]["geometry"]["coordinates"]

      # geoJSON fournit la longitude en 1ère coord
      # donc, inverser les coordonnées
      [geo_json_coords[1], geo_json_coords[0]]
    end

    def self.read_academy_parameter
      school = School.first
      return if school.nil?
  
      return school.academy
    end
    
    def self.read_zone_parameter
      school = School.first
      return if school.nil?
  
      return school.zone
    end

    def initialize(year = nil, academie = nil, zone = nil, address = nil)
      @year = year.to_i

      if academie
        @academie = academie
      elsif zone
        @zone = zone
      elsif address
        location = SchoolHolidays.fetch_location_for_address(address)
        @academie = SchoolHolidays.fetch_academie_from_location(location) unless location.nil?
      end

      validate!
    end

    # Renvoie les jours fériés de l'année civile sous la forme d'un tableau [{:date => DateTime, :label => String}, etc...]
    # ou renvoie {} en cas d'erreur
    def fetch_school_holidays
      # Le principe est le suivant
      #   département -> code académie (appel 1)
      #   code académie -> libellé académie (appel 2)
      #   libellé académie + année -> vacances scolaires (appel 3) - ouf !

      # si on a une académie
      if @academie
        school_holidays_service_url = "https://data.education.gouv.fr/api/records/1.0/search/?dataset=fr-en-calendrier-scolaire&facet=description&facet=start_date&facet=end_date&facet=location&facet=zones&facet=annee_scolaire&refine.location=#{@academie}&refine.annee_scolaire=#{@year}-#{@year + 1}"

        # si pas d'académie, on doit avoir une zone
      else
        school_holidays_service_url = "https://data.education.gouv.fr/api/records/1.0/search/?dataset=fr-en-calendrier-scolaire&facet=description&facet=start_date&facet=end_date&facet=location&facet=zones&facet=annee_scolaire&refine.zones=#{@zone}&refine.annee_scolaire=#{@year}-#{@year + 1}"
      end

      uri = URI(school_holidays_service_url)

      begin
        response = Net::HTTP.get(uri)
        holidays_records = JSON.parse(response)["records"]
      rescue StandardError
        return {}
      end

      rmap = holidays_records.map do |r|
        {
          start_date: r["fields"]["start_date"],
          end_date: r["fields"]["end_date"],
          label: r["fields"]["description"],
          zone: r["fields"]["zones"],
        }
      end
    end

    def fetch_school_zone
      school_holidays_service_url = "https://data.education.gouv.fr/api/records/1.0/search/?dataset=fr-en-calendrier-scolaire&rows=1&facet=description&facet=start_date&facet=end_date&facet=location&facet=zones&facet=annee_scolaire&refine.location=#{@academie}&refine.annee_scolaire=#{@year}-#{@year + 1}"

      uri = URI(school_holidays_service_url)

      begin
        response = Net::HTTP.get(uri)
        holidays_records = JSON.parse(response)["records"][0]
      rescue StandardError
        return {}
      end

      holidays_records&.dig("fields", "zones")
    end

    private

    def number?(string)
      true if Float(string)
    rescue StandardError
      false
    end

    def validate!
      # il nous faut au moins l'année et soit l'académie, soit la zone
      if @year.zero? || (@academie.nil? && @zone.nil?)
        raise ArgumentError,
              "Invalid arguments"
      end

      # encodage des arguments (il peut y avoir des accents)
      @academie = CGI.escape @academie if @academie
      @zone = CGI.escape @zone if @zone
    end
  end
end
