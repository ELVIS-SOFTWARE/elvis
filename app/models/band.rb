# == Schema Information
#
# Table name: bands
#
#  id             :bigint           not null, primary key
#  name           :string           not null
#  blacklisted    :boolean          default(FALSE), not null
#  music_genre_id :bigint
#  band_type_id   :bigint
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#

class Band < ApplicationRecord
    belongs_to :band_type
    belongs_to :music_genre

    has_many :bands_users
    has_many :practice_sessions
    has_many :users, through: :bands_users


    def self.display_class_name(singular = true)
        singular ? "groupe de musique" : "groupes de musique"
    end

    def self.class_name_gender
        return :M
    end

    def member_links_with_band(season = Season.current_apps_season)
        [
            self.bands_users.where(season: season).includes(:instrument),
            # self.inverse_family_members.where(season: season).includes(:user),
        ].flatten           
    end
end
