# == Schema Information
#
# Table name: seasons
#
#  id                                   :bigint           not null, primary key
#  label                                :string
#  start                                :datetime
#  end                                  :datetime
#  is_current                           :boolean
#  is_off                               :boolean
#  created_at                           :datetime         not null
#  updated_at                           :datetime         not null
#  closing_date_for_applications        :datetime
#  nb_lessons                           :integer          default(31)
#  opening_date_for_applications        :datetime
#  opening_date_for_new_applications    :datetime
#  date_for_teacher_planning_validation :datetime
#  next_season_id                       :bigint
#

class Season < ApplicationRecord
  belongs_to :next_season, optional: true, class_name: "Season"

  has_many :holidays, dependent: :delete_all

  has_many :activity_ref_pricing
  has_many :activity_refs, through: :activity_ref_pricing
  has_many :pricing_categories, through: :activity_ref_pricing

  has_many :teacher_season
  has_many :teachers, through: :teacher_seasons

  has_many :time_interval_preferences, dependent: :destroy

  scope :order_by_start, -> { order(start: :desc) }
  scope :from_interval, ->(interval) { includes(:holidays).where("tstzrange(seasons.start, seasons.end, '[]') @> tstzrange(?, ?, '[]')", interval.start, interval.end) }

  validates :start, presence: true
  validates :end, presence: true
  validates :opening_date_for_applications, presence: true
  validates :opening_date_for_new_applications, presence: true
  validates :closing_date_for_applications, presence: true

  validate :check_start_end
  validate :check_applications_dates

  def self.display_class_name(singular = true)
    singular ? "saison" : "saisons"
  end

  def self.class_name_gender
    return :F
  end

  # renvoie la saison pour laquelle les inscriptions devraient être ouvertes
  # @return [Season] la saison en cours ou bien la saison suivante
  def self.current_apps_season
    Rails.cache.fetch("current_apps_season", expires_in: 12.hours) do

      return nil unless Season.any?

      s = Season.current

      if DateTime.now > s&.closing_date_for_applications
        s = Season.next
      end

      s
    end
  end

  def self.is_pre_application_period
    season = current_apps_season || current

    return false if season.nil?

    the_time = DateTime.now

    the_time < season.closing_date_for_applications &&
      the_time >= season.opening_date_for_applications &&
      the_time < season.opening_date_for_new_applications
  end

  def self.registration_opened
    season = current_apps_season || current

    # si on n'a pas de saison en cours, on considère que les inscriptions sont ouvertes (bdd vide)
    return true if season.nil?

    the_time = DateTime.now

    the_time >= season.opening_date_for_new_applications &&
      the_time < season.closing_date_for_applications
  end

  def self.all_seasons_cached
    Rails.cache.fetch("seasons:all", expires_in: 5.minutes) do
      Season.all
    end
  end

  # renvoie la date du lundi de la semaine qui contient le jour de début de la saison
  # ex : si la saison commence le jeudi 1er septembre 2022, on renvoie le lundi 29 août 2022
  def first_week_date
    # on cherche le jour du 1er cours de la saison
    # on convertit d'abord le 1er jour de la saison (s.start, objet Time) en objet Date
    start_date = Date.parse(start.to_s)

    # on récupère la date du lundi qui précède le début de la saison (ne change rien si c'est déjà un lundi)
    monday = start - (start_date.cwday - 1).day
    monday
  end

  def previous
    neighbour_season("asc")
  end

  def next
    neighbour_season("desc")
  end

  def self.next
    next_id = current.next_season_id

    includes(:holidays).where(id: next_id).first
  end

  def self.current
    Rails.cache.fetch("current_season", expires_in: 12.hours) do
      includes(:holidays).where(is_current: true).first
    end
  end

  def is_next
    s = Season.current
    return false if s.nil?

    s.next_season_id == id
  end

  def check_start_end
    if start.present? && self.end.present? && start > self.end
      errors.add(:end, "doit être postérieur au début de saison")
    end
  end

  def check_applications_dates
    previous = self.previous

    if start.present? && opening_date_for_applications.present? && start <= opening_date_for_applications
      errors.add(:opening_date_for_applications, "doit être antérieur au début de saison")
    end

    if opening_date_for_new_applications.present? && opening_date_for_applications.present? && opening_date_for_new_applications < opening_date_for_applications
      errors.add(:opening_date_for_new_applications, "doit être postérieur à la date d'ouverture des ré-inscriptions")
    end

    if opening_date_for_new_applications.present? && closing_date_for_applications.present? && opening_date_for_new_applications > closing_date_for_applications
      errors.add(:opening_date_for_new_applications, "doit être antérieur à la date de clôture des inscriptions")
    end

    if self.end.present? && closing_date_for_applications.present? && self.end < closing_date_for_applications
      errors.add(:closing_date_for_applications, "doit être antérieur à la fin de saison")
    end

    if previous.present? && opening_date_for_applications.present? && previous.closing_date_for_applications > opening_date_for_applications
      errors.add(:opening_date_for_applications, "doit être postérieur à la date de clôture des inscriptions de la saison précédente")
    end

    if previous.present? && opening_date_for_new_applications.present? && previous.closing_date_for_applications > opening_date_for_new_applications
      errors.add(:opening_date_for_new_applications, "doit être postérieur à la date de clôture des inscriptions de la saison précédente")
    end
  end

  def start_formatted
    I18n.localize self.start, format: :date_month_concise
  end

  def end_formatted
    I18n.localize self.end, format: :date_month_concise
  end

  def self.get_next_season_candidates(exclude_id: nil)
    join_sql = "LEFT JOIN Seasons s2
        ON seasons.id=s2.next_season_id
        WHERE s2.id IS NULL"
    join_sql += " AND seasons.id != #{exclude_id}" unless exclude_id.nil?
    Season.joins(join_sql)
  end

  def self.destroy_params
    params = ApplicationRecord::destroy_params

    params.merge!({
                    auto_deletable_references: [Holiday, FamilyMemberUser, ActivityRefPricing],
                    success_message: success_message
                  })
  end

  def pre_destroy
    raise "Impossible de supprimer la saison en cours" if is_current

    previous_season = self.previous

    if previous_season
      previous_season.next_season_id = nil
      previous_season.save!
    end
  end

  def starts_before(to_season)
    self.start <= to_season.start
  end

  private

  def neighbour_season(dir)
    sorted_seasons = Season.all.order("start #{dir}")

    self_index = sorted_seasons.find_index { |s| s.id == self.id }

    if !self_index || self_index == 0
      return nil
    else
      return sorted_seasons[self_index - 1]
    end
  end
end
