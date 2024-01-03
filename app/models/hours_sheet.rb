# == Schema Information
#
# Table name: hours_sheets
#
#  user_id     :bigint           not null
#  year        :integer          not null
#  month       :integer          not null
#  json_sheet  :jsonb
#  is_complete :boolean          default(TRUE)
#

# /!\ ........................................................ /!\
#       DEPRECATED : plus utilisée
# /!\ ........................................................ /!\

class HoursSheet < ApplicationRecord
    belongs_to :user, required: true

    def self.display_class_name(singular = true)
        singular ? "feuille d'heure" : "feuilles d'heure"
    end

    def self.class_name_gender
        return :F
    end

end
