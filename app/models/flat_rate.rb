# == Schema Information
#
# Table name: flat_rates
#
#  id            :bigint           not null, primary key
#  name          :string           not null
#  enable        :boolean          default(FALSE), not null
#  nb_hour       :integer          default(0), not null
#  solo_duo_rate :integer          default(0), not null
#  group_rate    :integer          default(0), not null
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#
class FlatRate < ApplicationRecord

  def self.display_class_name(singular = true)
    singular ? "forfait" : "forfaits"
  end

  def self.class_name_gender
    return :M
  end

end
