# == Schema Information
#
# Table name: activity_refs
#
#  id                        :bigint           not null, primary key
#  label                     :string           not null
#  created_at                :datetime         not null
#  updated_at                :datetime         not null
#  image                     :string
#  occupation_limit          :integer
#  occupation_hard_limit     :integer
#  monthly_price             :integer
#  quarterly_price           :integer
#  annual_price              :integer
#  special_price             :integer
#  has_additional_student    :boolean          default(FALSE)
#  is_lesson                 :boolean          default(TRUE)
#  is_visible_to_admin       :boolean          default(FALSE)
#  deleted_at                :datetime
#  from_age                  :integer          not null
#  to_age                    :integer          not null
#  is_evaluable              :boolean          default(FALSE)
#  is_unpopular              :boolean          default(FALSE)
#  is_work_group             :boolean          default(FALSE)
#  activity_ref_kind_id      :bigint           not null
#  activity_type             :integer
#  allows_timeslot_selection :boolean          default(FALSE)
#  nb_lessons                :integer
#

# CSV_TEMPLATES = {
#   full: %w[id label created_at updated_at image occupation_limit occupation_hard_limit monthly_price quarterly_price annual_price special_price has_additional_student is_lesson is_visible_to_admin deleted_at from_age to_age is_evaluable is_unpopular is_work_group activity_ref_kind_id activity_type allows_timeslot_selection kind
#               activity_ref_kind.id activity_ref_kind/name activity_ref_kind/pour_enfants activity_ref_kind/pour_enfants3],
#   light: %w[activity_ref_kind.name label],
# }

# ["id",
# "label",
# "created_at",
# "updated_at",
# "image",
# "occupation_limit",
# "occupation_hard_limit",
# "monthly_price",
# "quarterly_price",
# "annual_price",
# "special_price",
# "has_additional_student",
# "is_lesson",
# "is_visible_to_admin",
# "deleted_at",
# "from_age",
# "to_age",
# "is_evaluable",
# "is_unpopular",
# "is_work_group",
# "activity_ref_kind_id",
# "activity_type",
# "allows_timeslot_selection",
# "kind",
# "activity_ref_kind.id",
# "activity_ref_kind/name",
# "activity_ref_kind/pour_enfants",
# "activity_ref_kind/pour_enfants3"]

class ActivityRef < ApplicationRecord
  include TranslateEnum
  acts_as_paranoid

  validates :occupation_limit, presence: true
  validates :occupation_hard_limit, presence: true

  validates :from_age, presence: true
  validates :to_age, presence: true

  validate :check_ages_are_corrects, :check_occupation_limits_are_corrects

  attribute :kind

  update_index("activities") { self }

  def run_chewy_callbacks
    base_chewy_callbacks
  end

  has_many :activity_ref_pricing, dependent: :restrict_with_exception
  has_many :seasons, through: :activity_ref_pricing
  has_many :pricing_categories, through: :activity_ref_pricing
  has_many :activities, dependent: :restrict_with_exception

  has_many :next_cycles, class_name: :ActivityRefCycle, foreign_key: :from_activity_ref_id, dependent: :destroy

  has_many :time_interval_preferences, dependent: :destroy

  has_one_attached :picture

  has_many :activity_refs_instruments, dependent: :destroy
  has_many :instruments, through: :activity_refs_instruments

  has_many :desired_activities, dependent: :restrict_with_exception
  has_many :evaluation_appointments, dependent: :restrict_with_exception
  has_many :levels, dependent: :restrict_with_exception
  has_many :new_student_level_questionnaires, dependent: :restrict_with_exception
  has_many :room_activities, dependent: :destroy
  has_many :teachers_activity_refs, dependent: :destroy

  has_many :users, through: :teachers_activity_refs

  belongs_to :activity_ref_kind, required: false

  scope :evaluable, -> { where(is_evaluable: true) }

  enum activity_type: { child: 0, cham: 1, chorale_ma: 2, eveil_musical: 3, actions_culturelles: 4 }
  translate_enum :activity_type

  def self.display_class_name(singular = true)
    singular ? "activité" : "activités"
  end

  def self.class_name_gender
    return :F
  end

  def display_price
    season = Season.current_apps_season || Season.current # au cas la saison est null (ne devrait pas arriver)

    return 0 unless self.activity_ref_pricing

    maxprice = self.activity_ref_pricing
                   .where(from_season_id: season)
                   .maximum(:price)

    maxprice.nil? ? 0 : maxprice
  end

  def max_display_prices_by_season
    self.activity_ref_pricing
        .group_by(&:from_season_id)
        .transform_values { |values| values.max_by(&:price)&.price }
  end

  # Retourne le nom à afficher pour une activité
  # Renvoie le nom de la famille d'activités ou le nom de l'activité pour les activités enfance, CHAM
  # et celles qui autorisent le choix d'un créneau
  def display_name
    if allows_timeslot_selection ||
      activity_type == "child" ||
      activity_type == "cham"

      return label
    end

    return activity_ref_kind.name
  end

  def kind
    activity_ref_kind&.name
  end

  def check_ages_are_corrects
    if from_age.present? && to_age.present? && from_age > to_age
      errors.add(:to_age, "doit être supérieur à from_age")
    end
  end

  def check_occupation_limits_are_corrects
    if occupation_limit.present? && occupation_hard_limit.present? && occupation_limit > occupation_hard_limit
      errors.add(:occupation_hard_limit, "doit être supérieur à occupation_limit")
    end
  end

  def self.destroy_params
    base_params = ApplicationRecord.destroy_params

    base_params.merge({
                        ignore_references: [ActivityRefKind],
                        auto_deletable_references: [ActivityRefPricing],
                        success_message: success_message
                      })
  end

  def picture_path
    picture.attached? ? Rails.application.routes.url_helpers.rails_blob_path( picture_attachment.blob, only_path: true) : "default_activity.png"
  end
end
