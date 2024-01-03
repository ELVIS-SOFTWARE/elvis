# == Schema Information
#
# Table name: holidays
#
#  id         :bigint           not null, primary key
#  date       :date
#  season_id  :bigint
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  label      :string
#  kind       :string
#

class Holiday < ApplicationRecord
  belongs_to :season

  def self.display_class_name(singular = true)
    singular ? "congé" : "congés"
  end

  def self.class_name_gender
    return :M
  end

end
