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

  belongs_to :default_activity_ref, class_name: "ActivityRef", optional: true

  validate :verify_default_activity_ref_is_for_same_activity_ref_kind

  def self.display_class_name(singular = true)
    singular ? "famille d'activité" : "familles d'activités"
  end

  def self.class_name_gender
    return :F
  end

  private

  def verify_default_activity_ref_is_for_same_activity_ref_kind
    if default_activity_ref && default_activity_ref.activity_ref_kind != self
      errors.add(:default_activity_ref, "doit être de la même famille d'activité")
    end
  end
end
