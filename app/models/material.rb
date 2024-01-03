# == Schema Information
#
# Table name: materials
#
#  id         :bigint           not null, primary key
#  name       :string           not null
#  active     :boolean          default(FALSE), not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  prix       :float
#
class Material < ApplicationRecord

  def self.display_class_name(singular = true)
    singular ? "matériel" : "matériels"
  end

  def self.class_name_gender
    return :M
  end

end
