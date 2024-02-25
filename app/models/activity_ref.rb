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

  # Indique si l'activité est *substituable* au sein d'une famille d'activités.
  # Une activité *substituable* est une activité qui, dans le processus d'inscription, peut être remplacée indifféremment
  # par une autre activité de la même famille.
  #
  # Toutes les activités sont considérées substituables sauf
  # * les activités enfance,
  # * les activités CHAM
  # * et les activités qui autorisent le choix d'un créneau
  def substitutable?
    !(
      allows_timeslot_selection ||
        activity_type == "child" ||
        activity_type == "cham"
    )
  end

  # Retourne le nom à afficher pour une activité
  # Renvoie le nom de la famille d'activités ou le nom de l'activité pour les activités enfance, CHAM
  # et celles qui autorisent le choix d'un créneau
  def display_name
    if substitutable?
      activity_ref_kind.name
    else
      label
    end
  end

  # Calcule les tarifs max pour toutes les activités et les familles d'activités et les stocke en cache (durée 5 minutes)
  #  Cette méthode est créée dans un objectif de performance : elle évite de faire des requêtes SQL à chaque fois que l'on veut afficher un tarif
  # @param [Season] season la saison pour laquelle calculer les tarifs ou omis pour toutes les saisons
  def self.compute_all_display_prices(season = nil)

    pricings = ActivityRefPricing
                 .select("
    activity_ref_pricings.activity_ref_id,
    activity_refs.id,
    activity_refs.activity_ref_kind_id,
    activity_ref_pricings.price,
    activity_ref_pricings.pricing_category_id,
    activity_ref_pricings.from_season_id,
    from_seasons.start as from_season_start,
    activity_ref_pricings.to_season_id,
    to_seasons.end as to_season_end
    ")
                 .joins(:activity_ref)
                 .includes(:activity_ref)
                 .joins("inner join seasons from_seasons on activity_ref_pricings.from_season_id = from_seasons.id")
                 .joins("left join seasons to_seasons on activity_ref_pricings.to_season_id = to_seasons.id or activity_ref_pricings.to_season_id is null")
                 .where("activity_ref_pricings.deleted_at is null")

    if season.is_a?(Season)
      pricings = pricings.where("from_seasons.start <= ? AND (to_seasons.end IS NULL OR to_seasons.end >= ?)", season.start, season.start)
    end

    # group pricings by activity_ref_id
    # pricings_by_ar = pricings.group_by(&:activity_ref_id)

    seasons = Season.all_seasons_cached
    pricings_by_ar = {}

    # first pass : iterate over  pricings
    # and store them in a hash by activity_ref_id
    pricings.each do |pricing|
      # if the activity_ref_id is not in the hash, create a new array
      # and store the pricing in it
      if pricings_by_ar[pricing.activity_ref_id].nil?
        pricings_by_ar[pricing.activity_ref_id] = [pricing]
      else
        # if the activity_ref_id is already in the hash, just add the pricing to the array
        pricings_by_ar[pricing.activity_ref_id] << pricing
      end
    end

    # iterate over the hash pricings_by_ar
    # for each activity_ref, iterate over each season
    # for each season, compute the max price
    # and store it in cache as "activity_ref_id:season_id:price"
    max_pricings_by_season = {}
    max_ar_kind_pricings_by_season = {}

    pricings_by_ar.each do |activity_ref_id, pricings|
      max_pricings_by_season[activity_ref_id] = {}
      ar_kind_id = pricings.first.activity_ref.activity_ref_kind_id
      max_ar_kind_pricings_by_season[ar_kind_id] ||= {}

      seasons.each do |season|
        max_price = pricings
                      .select { |p|
                        p.from_season_start <= season.start &&
                          (p.to_season_id.nil? || p.to_season_end >= season.start) }
                      .map(&:price)
                      .max || 0

        max_pricings_by_season[activity_ref_id][season.id] = max_price

        if max_price > max_ar_kind_pricings_by_season[ar_kind_id][season.id].to_i
          max_ar_kind_pricings_by_season[ar_kind_id][season.id] = max_price
        end

        Rails.cache.write(
          "activity_ref_id:#{activity_ref_id}:#{season.id}:price", max_price,
          expires_in: 5.minute)
      end

      max_ar_kind_pricings_by_season.each do |ar_kind_id, hash|
        hash.each do |season_id, max_price|
          Rails.cache.write(
            "activity_ref_kind_id:#{ar_kind_id}:#{season_id}:price", max_price,
            expires_in: 5.minute)
        end
      end

    end

  end

  def display_price(season = Season.current_apps_season || Season.current)
    ActivityRef.compute_all_display_prices unless Rails.cache.exist?("activity_ref_id:#{id}:#{season.id}:price")

    if substitutable?
      Rails.cache.read("activity_ref_kind_id:#{activity_ref_kind_id}:#{season.id}:price")
    else
       Rails.cache.read("activity_ref_id:#{id}:#{season.id}:price")
    end
  end

  def display_prices_by_season
    Season.all_seasons_cached.each_with_object({}) do |season, hash|
      hash[season.id] = display_price(season)
    end
  end

  # def display_price(season = Season.current_apps_season || Season.current)
  #   if substitutable?
  #     activity_ref_kind&.display_price(season)
  #   else
  #     max_price_for_activity_ref(season)
  #   end
  # end
  #
  # def max_price_for_activity_ref(season = Season.current_apps_season || Season.current)
  #   puts "================ max_price_for_activity_ref for ActivityRef ##{id} season #{season.label}"
  #   ActivityRefPricing.for_activity_ref(self).for_season(season).maximum(:price) || 0
  # end
  #
  # def display_prices_by_season
  #   puts "================ display_prices_by_season for ActivityRef ##{id}"
  #
  #   Season.all.each_with_object({}) do |season, hash|
  #     hash[season.id] = display_price(season)
  #   end
  # end

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
    picture.attached? ? Rails.application.routes.url_helpers.rails_blob_path(picture_attachment.blob, only_path: true) : ""
  end
end
