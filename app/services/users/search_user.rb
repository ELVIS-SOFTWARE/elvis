module Users
  class SearchUser
    def initialize(last_name, first_name, birthday, season_id, adherent_number, includes, exact_search = true)
      @last_name = last_name.strip.capitalize
      @first_name = first_name.strip.capitalize
      @birthday = birthday
      @adherent_number = adherent_number
      @season = season_id.nil? ? nil : Season.find(season_id)
      @includes = includes
      @exact_search = exact_search
    end

    def execute
      users = User.includes(:telephones, :planning, :payer_payment_terms, :adhesions, :activity_applications, family_member_users: {member: [:telephones]}, inverse_family_members: {user: [:telephones]})

      users = if @exact_search
                users.ci_find(:first_name, @first_name).ci_find(:last_name, @last_name)
              else
                users.ci_ilike_find(:first_name, @first_name).ci_ilike_find(:last_name, @last_name)
              end

      users = users.where(birthday: @birthday) unless @birthday.nil?
      users = users.where(adherent_number: @adherent_number) unless @adherent_number.nil?


      users.map do |u|
        user = u.as_json(@includes)

        # filter family links by given season
        if @includes.dig("methods", "family_links_with_user")
          u["family_links_with_user"] = u.family_links_with_user(@season)
        end

        unless @season.nil? || u.planning.nil?
          user["availabilities"] = u.planning
                                    .time_intervals
                                    .where({ is_validated: false, start: (@season.start..@season.end) }).as_json
        end

        user
      end
    end
  end
end
