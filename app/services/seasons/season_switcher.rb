module Seasons
    # ajoute les jours fériés à la saison
    class SeasonSwitcher
      def initialize(season)
        @season = season
        @current_season = Season.current
      end

      def execute
        validate!

        # si la saison est déjà active, on peut partir
        return true if @current_season && @current_season.id == @season.id

        ActiveRecord::Base.transaction do
          @current_season.is_current = false
          @season.is_current = true
          @current_season.save(validate: false) # pas besoin de verifier les validation juste pour changer de saison.
          @season.save(validate: false)

          Season.first.save

          # on invalide le cache de saisons
          Season.clear_method_cache :current, :current_apps_season
        end

        true

      rescue Exception => e
        Rails.logger.error "#{e}\n#{e.backtrace.join("\n")}"
        false
      end

      def self.execute(*args)
        new(*args).execute
      end

      private

      def validate!
      
        @season.nil? && raise(ArgumentError, "Invalid arguments")
        
      end
    end
end
