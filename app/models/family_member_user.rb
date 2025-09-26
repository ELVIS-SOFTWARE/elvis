# == Schema Information
#
# Table name: family_member_users
#
#  id                :bigint           not null, primary key
#  user_id           :bigint
#  member_id         :bigint
#  link              :string
#  is_accompanying   :boolean
#  is_paying_for     :boolean
#  is_legal_referent :boolean
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  deleted_at        :datetime
#  is_to_call        :boolean          default(FALSE)
#  season_id         :bigint
#

class FamilyMemberUser < ApplicationRecord
    acts_as_paranoid

    belongs_to :user
    belongs_to :user_csv, -> { select(:id, :first_name, :last_name) }, class_name: "User", required: false
    belongs_to :member, :class_name => 'User'
    belongs_to :member_csv, -> { select(:id, :first_name, :last_name) }, class_name: 'User', required: false
    belongs_to :season, required: false
    belongs_to :season_csv, -> { select(:id) }, class_name: "Season", required: false

    # get all family members for a
    scope :for_season, ->(season) {for_season_id(season&.id)}

    # get all family members for a season (get from this season or previous seasons if no link for this season)
    scope :for_season_id, ->(season_id) {
        # use with deleted to permit deletion of link for season and next seasons BUT keep link for previous seasons
        joins("join (#{with_deleted
                         .where(season_id: [..season_id]).group(:user_id, :member_id)
                         .select(:user_id, :member_id, "max(season_id) as season_id").to_sql}
                    ) last_fmus
               on family_member_users.user_id = last_fmus.user_id and family_member_users.member_id = last_fmus.member_id and family_member_users.season_id = last_fmus.season_id")
    }

    after_save :invalidate_family_cache
    after_destroy :invalidate_family_cache


    def self.display_class_name(singular = true)
        singular ? "membre de famille" : "membres de famille"
    end

    def self.class_name_gender
        return :M
    end

    def related_member
        self.member
    end

    def inverse_link
        FamilyMemberUsers::inverse_link(self.link, self.user.sex)
    end

    def get_active_adhesion
        adhesion = Adhesion.where("user_id = ?",self.user_id).last
        unless adhesion.nil?
            return adhesion
        else
            return nil
        end
    end

    def invalidate_family_cache
      current_season_id = Season.current&.id
      Rails.cache.delete("family_members:user_#{user_id}:season_#{current_season_id}") if current_season_id
      Rails.cache.delete("family_members:user_#{member_id}:season_#{current_season_id}") if current_season_id
    end

end
