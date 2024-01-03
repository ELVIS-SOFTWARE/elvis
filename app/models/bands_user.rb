# == Schema Information
#
# Table name: bands_users
#
#  id            :bigint           not null, primary key
#  band_id       :bigint
#  user_id       :bigint
#  instrument_id :bigint
#  joined_at     :date
#  left_at       :date
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  first_name    :string
#  last_name     :string
#  email         :string
#

class BandsUser < ApplicationRecord
    belongs_to :band
    belongs_to :user
    belongs_to :instrument

    def self.display_class_name(singular = true)
        singular ? "membre de groupe de musique" : "membres de groupes de musique"
    end

    def self.class_name_gender
        return :M
    end

end
