module Adhesions
  class CreateAdhesion
    def initialize(id, validity_start_date = DateTime.now.to_s)
      @id = id
      @user = User.find(id)
      @validity_start_date = validity_start_date
    end

    def execute

      # on vérifie d'abord s'il n'existe pas une adhésion qui recouvre la période demandée
      if Adhesion.where("user_id = :user_id AND validity_start_date<=:new_adh_end AND validity_end_date>=:new_adh_start",
        { user_id: @user.id, new_adh_start: @validity_start_date, new_adh_end: @validity_start_date.to_date + 1.year })
                 .any?
        raise ArgumentError, 'new adhesion would overlap existing adhesion'
      end

      @adhesion = Adhesion.create!({ user_id: @user.id, is_active: true })

      @adhesion.validity_start_date = Time.parse(@validity_start_date)
      @adhesion.validity_end_date = @adhesion.validity_start_date + 1.year

      detected_season = Season.where(
        "extract(year from seasons.start) = ? AND extract(year from seasons.end) = ?",
        @adhesion.validity_start_date.year,
        @adhesion.validity_end_date.year
      ).first

      @adhesion.season = detected_season
      @adhesion.save
    end
  end
end