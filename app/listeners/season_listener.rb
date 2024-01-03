# frozen_string_literal: true

class SeasonListener < BaseListener
  def self.subscribe
    event_ids ||= []

    event_ids << EventHandler.season.create.subscribe(false) do |sender:, args:|
      season = args[:model]

      previous_season = season&.previous

      # if previous_season has no next_season, set it to the new season
      if previous_season.present? && previous_season.next_season_id.nil?
        previous_season.update_column(:next_season_id, season.id)
      end
    end

    event_ids << EventHandler.season.update.subscribe(false) do |sender:, args:|
      # @type [Season]
      season = args[:model]
      changes = args[:changes]

      # if season is_current changed to true, create a new season with the same dates (+1 year)
      if changes["is_current"] == [false, true]

        if season.next_season_id.nil?
          retrieved_next_season = season.next

          if retrieved_next_season.nil?
            diff = 1
            diff_duration = diff.year

            # pas besoin d'associer la nouvelle saison à la précédente, car la création va déclencher l'événement season.create ci-dessus
            new_season = Season.create!(
              start: season.start + diff_duration,
              end: season.end + diff_duration,
              is_current: false,
              next_season_id: nil,
              opening_date_for_applications: season.opening_date_for_applications + diff_duration,
              opening_date_for_new_applications: season.opening_date_for_new_applications + diff_duration,
              closing_date_for_applications: season.closing_date_for_applications + diff_duration,
              date_for_teacher_planning_validation: season.date_for_teacher_planning_validation ? season.date_for_teacher_planning_validation + diff_duration : nil,
              label: "Saison #{season.start.year + diff}-#{season.end.year + diff}"
            )

            bank_holidays_zone = Holidays::BankHolidays.read_zone_parameter
            school_academy = Holidays::SchoolHolidays.read_academy_parameter

            if bank_holidays_zone && school_academy
              Seasons::PopulateHolidays
                .new(season: new_season, bank_holidays_zone: bank_holidays_zone, academie: school_academy)
                .execute
            end
          else
            season.update_column(:next_season_id, retrieved_next_season.id)
          end
        end
      end
    end
  end
end
