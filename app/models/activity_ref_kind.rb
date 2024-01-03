# == Schema Information
#
# Table name: activity_ref_kinds
#
#  id           :bigint           not null, primary key
#  name         :string
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  is_for_child :boolean          default(FALSE)
#  deleted_at   :datetime
#
class ActivityRefKind < ApplicationRecord

  acts_as_paranoid

  validates_presence_of :name, message: "ne peut être vide"
  validates_uniqueness_of :name, message: "existe déjà", conditions: -> { where(deleted_at: nil) }

  has_many :activity_refs

  def self.display_class_name(singular = true)
    singular ? "famille d'activité" : "familles d'activités"
  end

  def self.class_name_gender
    return :F
  end
end
