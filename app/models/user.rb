# == Schema Information
#
# Table name: users
#
#  id                              :bigint           not null, primary key
#  email                           :string           default("")
#  encrypted_password              :string           default(""), not null
#  reset_password_token            :string
#  reset_password_sent_at          :datetime
#  remember_created_at             :datetime
#  sign_in_count                   :integer          default(0), not null
#  current_sign_in_at              :datetime
#  last_sign_in_at                 :datetime
#  current_sign_in_ip              :inet
#  last_sign_in_ip                 :inet
#  created_at                      :datetime         not null
#  updated_at                      :datetime         not null
#  confirmation_token              :string
#  confirmed_at                    :datetime
#  confirmation_sent_at            :datetime
#  first_name                      :string
#  last_name                       :string
#  sex                             :string
#  profession                      :string
#  school                          :string
#  is_admin                        :boolean          default(FALSE)
#  is_teacher                      :boolean          default(FALSE)
#  birthday                        :date
#  self_level                      :integer
#  solfege                         :boolean
#  handicap                        :boolean          default(FALSE)
#  handicap_description            :string
#  adherent_number                 :integer
#  evaluation_level_ref_id         :bigint
#  is_paying                       :boolean
#  is_accompanying                 :boolean
#  address_id                      :integer
#  deleted_at                      :datetime
#  authentication_token            :text
#  authentication_token_created_at :datetime
#  first_connection                :boolean          default(TRUE)
#  has_verified_infos              :boolean          default(FALSE)
#  checked_gdpr                    :boolean          default(FALSE)
#  checked_image_right             :boolean
#  checked_newsletter              :boolean
#  is_creator                      :boolean          default(FALSE)
#  organization_id                 :bigint
#

require "csv"

class User < ApplicationRecord
  update_index("users") { self } #  specifying index, type and back-reference for updating

  before_save :strip_names

  def run_chewy_callbacks
    base_chewy_callbacks
  end

  #  after user save or destroy

  # Include default devise modules. Others available are:
  # :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :token_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable
  #  :authentication_keys => [:login]

  attr_accessor :login

  # Validation
  acts_as_paranoid
  validates :password, confirmation: true
  validates_as_paranoid
  validate :unique_entry
  validate :valid_birth_date
  # avoid email uniqueness on Devise::Validation
  def will_save_change_to_email?
    false
  end

  before_create :create_planning
  before_save :ensure_authentication_token
  before_save :ensure_confirmation_token
  before_save :flip_flags

  scope :teachers, -> { where(is_teacher: true) }
  scope :admins, -> { where(is_admin: true) }
  scope :members, -> { where("id IN (SELECT DISTINCT user_id FROM adhesions WHERE is_active = true)") }
  scope :students, -> { where("id IN (SELECT DISTINCT user_id FROM students)") }

  scope :not_students, -> { where.not(id: students) }
  scope :not_members, -> { where.not(id: members) }
  scope :not_teachers, -> { where.not(id: teachers) }
  scope :not_admins, -> { where.not(id: admins) }

  # case insensitive scope, for quicker query
  scope :ci_find, ->(attribute, value) { where("lower(#{attribute}) = ?", value&.downcase) }
  scope :ci_ilike_find, ->(attribute, value) { where("lower(#{attribute}) ILIKE ?", "%#{value.downcase}%") }

  has_many :activity_applications, dependent: :restrict_with_exception

  has_many :teachers_activity_refs, dependent: :restrict_with_exception
  has_many :activity_refs, through: :teachers_activity_refs

  has_one :planning, dependent: :destroy
  has_one :planning_csv, -> { select(:id, :user_id) }, class_name: "Planning", dependent: :destroy, required: false

  def planning_id
    planning.id if planning
  end

  has_many :teachers_activities, dependent: :restrict_with_exception
  has_many :teachers_activity_instances, dependent: :restrict_with_exception

  has_many :students, dependent: :restrict_with_exception
  has_many :activities, through: :students

  # 29/06/2022 : Suppression d'une relation qui est probablement inutile
  # has_many :options, dependent: :restrict_with_exception

  has_many :evaluation_appointments, foreign_key: "student_id", dependent: :destroy
  # has_many :activities, through: :options

  has_many :telephones, as: :phonable, dependent: :destroy
  has_many :telephones_csv, lambda {
    select(:id, :number, :label, :phonable_id, :phonable_type)
  }, class_name: "Telephone", as: :phonable, dependent: :destroy

  has_many :payment_schedules, foreign_key: :payable_id, dependent: :restrict_with_exception
  has_many :payments, foreign_key: :payable_id, dependent: :restrict_with_exception

  has_many :levels, dependent: :destroy
  has_many :levels_csv, lambda {
    select(:id, :user_id, :activity_ref_id, :evaluation_level_ref_id, :season_id)
  }, class_name: "Level", dependent: :destroy

  has_many :adhesions, dependent: :destroy

  # Family Association
  has_many :family_member_users, dependent: :destroy
  has_many :family_member_users_csv, lambda {
    select(:id, :is_legal_referent, :member_id, :user_id)
  }, class_name: "FamilyMemberUser", dependent: :destroy
  has_many :members, through: :family_member_users

  has_many :inverse_family_members, class_name: "FamilyMemberUser", foreign_key: "member_id", dependent: :destroy
  has_many :inverse_family_members_csv, lambda {
    select(:id, :is_legal_referent, :user_id, :member_id)
  }, class_name: "FamilyMemberUser", foreign_key: "member_id", dependent: :destroy
  has_many :inverse_members, through: :inverse_family_members, source: :user

  has_many :student_attendances, dependent: :restrict_with_exception

  has_many :user_addresses, dependent: :destroy
  has_many :addresses, through: :user_addresses
  has_many :addresses_csv, through: :user_addresses, source: :address_csv

  has_one_attached :avatar

  has_many :pre_applications, dependent: :restrict_with_exception

  has_many :time_interval_preferences, dependent: :destroy

  has_many :student_evaluations, foreign_key: :student_id, dependent: :restrict_with_exception

  has_many :new_student_level_questionnaires, dependent: :destroy
  has_many :application_change_questionnaires, dependent: :destroy

  has_many :time_interval_preferences, dependent: :destroy

  has_many :users_instruments, dependent: :destroy
  has_many :instruments, through: :users_instruments

  has_many :payer_payment_terms, class_name: "PayerPaymentTerms", foreign_key: :payer_id, dependent: :destroy
  has_many :payment_schedule_options, through: :payer_payment_terms

  has_many :consent_document_users, dependent: :destroy

  belongs_to :organization, optional: true

  def self.display_class_name(singular = true)
    singular ? "utilisateur" : "utilisateurs"
  end

  def self.class_name_gender
    return :M
  end

  # Récupère les paramètres de suppression
  # @return [{ auto_deletable_references: Array<Class<ApplicationRecord>>, undeletable_message: String, deletable_message: String, success_message: String }]
  def self.destroy_params
    base_params = ApplicationRecord.destroy_params

    base_params.merge({
                        auto_deletable_references: [FamilyMemberUser, UserAddress, Adhesion, Planning, Student, Level, NewStudentLevelQuestionnaire, PreApplication, ConsentDocumentUser],
                        undeletable_message: "L'utilisateur ne peut pas être supprimé parce que:<br/>",
                        success_message: success_message
                      })
  end

  # for validation, check if an user exist with given args (birthday, first_name & last_name)
  def unique_entry
    matched_user = User.where(
      birthday: birthday
    ).ci_find(:first_name, first_name).ci_find(:last_name, last_name).first
    if matched_user && (matched_user.id != id)
      errors.add(:base,
                 "un compte existe déjà avec cette combinaison Nom - Prénom - Date de Naissance.")
    end
  end

  def valid_birth_date
    if birthday.present? && birthday > DateTime.now
      errors.add(:Date_de_naissance, ': votre date de naissance est forcément dans le passé')
    end
  end

  def address
    addresses.first
  end

  def activity_application
    activity_applications.find_by(season: Season.current)
  end

  def self.find_first_by_auth_conditions(warden_conditions)
    conditions = warden_conditions.dup
    if login = conditions.delete(:login)
      where(conditions).where(["lower(email) = :value OR adherent_number::varchar(255) = :value",
                               { value: login.downcase }]).first
    else
      where(birthday: conditions["birthday"]).ci_find(:first_name, conditions["first_name"]).ci_find(:last_name,
                                                                                                     conditions["last_name"]).first
    end
  end

  def ensure_authentication_token
    self.authentication_token = generate_authentication_token if authentication_token.blank?
  end

  def ensure_confirmation_token
    generate_confirmation_token if confirmation_token.blank?
  end

  def flip_flags
    self.first_connection = false
    self.has_verified_infos = true
  end

  def generate_authentication_token
    loop do
      token = Devise.friendly_token
      break token unless User.where(authentication_token: token).first
    end
  end

  def self.check_uniq_users
    uniq = true
    uniq = User.all.each do |u|
      break false unless User.where(
        first_name: u.first_name,
        last_name: u.last_name,
        birthday: u.birthday
      ).first(2)
    end
  end

  def generate_confirmation_token
    token = nil
    loop do
      token = Devise.friendly_token
      break token unless User.where(confirmation_token: token).first
    end
    self.confirmation_token = token
  end

  def generate_confirmation_token!
    generate_confirmation_token
    save
  end

  def activity_application
    activity_applications.find_by(season_id: Season.current.id)
  end

  def payment_schedule
    payment_schedules.find_by(season_id: Season.current.id)
  end

  def family_links(season = Season.current_apps_season)
    return [] if season.nil?

    [
      family_member_users.for_season(season),
      inverse_family_members.for_season(season)
    ].flatten
  end

  def family_links_with_user(season = Season.current_apps_season)
    [
      family_member_users.for_season(season),
      inverse_family_members.for_season(season)
    ]
      .flatten
      .uniq { |m| m.user == self ? m.member : m.user }
      .map do |fm|
      is_inverse = fm.member == self
      member = is_inverse ? fm.user : fm.member
      res = member.as_json(include: {
        telephones: {},
        addresses: {}
      })
      res = res.merge(fm.as_json)
      res[:is_inverse] = is_inverse
      res[:id] = member.id
      res[:link_id] = fm.id
      res[:link] = fm.inverse_link if is_inverse
      res
    end
  end

  def family(season = Season.current_apps_season)
    [
      family_member_users.for_season(season).includes(:member).map(&:member),
      inverse_family_members.for_season(season).includes(:user).map(&:user)
    ].flatten.uniq
  end

  def family_link_with(user, season = Season.current_apps_season)
    family = user.family_links(season)

    # normal
    links = family.select { |fm| fm.related_member.id == id } + family.select { |fm| fm.user.id == id }
    # temporary solution to "many associated members" problem
    # by sorting them by a "who has the most enabled flags" criteria
    links.sort_by { |l| [l.is_to_call, l.is_paying_for, l.is_legal_referent].map(&:to_i).sum }.last
  end

  def parents
    parents = []
    family_member_users.each do |fl|
      parents << fl.member if fl.link == "père" or fl.link == "mère"
    end
    inverse_family_members.each do |fl|
      parents << fl.user if fl.link == "enfant"
    end
    parents.uniq
  end

  def payment_terms_summary(season_id)
    season_payment_terms = payer_payment_terms.where(season_id: season_id).first
    return "" if season_payment_terms.nil?

    season_payment_terms.summary
  end

  def update_addresses(addresses)
    # atomic update operation
    User.transaction do
      self.addresses.destroy_all
      addresses.each do |addr|
        address = Address.find_or_create_by(id: addr[:id])

        address.street_address = addr[:street_address]
        address.postcode = addr[:postcode]
        address.city = addr[:city]
        address.department = addr[:department]
        address.country = addr[:country]

        address.save!

        self.addresses << address
      end
    end
  end

  def as_json_with_family_and_addresses(options = {})
    h = as_json options
    h[:family] = family

    @addresses = {}
    family.each { |member| @addresses.store member.id, member.address }
    @addresses.store id, address
    @addresses.delete_if { |_key, value| value.nil? }
    @addresses = @addresses.to_a
    h[:addresses] = @addresses

    h
  end

  def display_family_link(user, season = Season.current_apps_season)
    # normal
    family_link = user.family_links(season).select { |fm| fm.related_member.id == id }.first
    if family_link.nil?
      # inverse
      inverse_family_link = user.family_links(season).select { |fm| fm.user.id == id }.first
      inverse_family_link.inverse_link.capitalize if !inverse_family_link.nil? && !inverse_family_link.inverse_link.nil?
    else
      family_link.link.nil? ? "" : family_link.link.capitalize
    end
  end

  def admin?
    is_admin
  end

  def teacher?
    is_teacher
  end

  def simple?
    !admin? && !teacher?
  end

  def has_planning?
    planning != nil
  end

  def full_name
    "#{first_name} #{last_name}"
  end

  def get_desired_activities
    activity_applications.map(&:desired_activities).flatten
  end

  def get_desired_activities_for_family(s = Season.current_apps_season)
    desired = []

    desired << activity_applications.where(season: s).map(&:desired_activities).flatten

    # à supprimer car sans doute redondant
    get_users_paying_for_self(s).each do |u|
      desired << u.activity_applications.where(season: s).map(&:desired_activities).flatten
    end

    whole_family(s.id).each do |u|
      desired << u.activity_applications.where(season: s).map(&:desired_activities).flatten
    end

    desired.flatten.uniq
  end

  def get_desired_activities_by_season
    Season.all.reduce({}) do |acc, s|
      acc.merge({
                  s.id => get_desired_activities_for_family(s)
                })
    end.reject { |_k, v| v.count.zero? }
  end

  # renvoie une liste de Students
  # qui représente les participants aux cours (Activity)  
  def get_list_of_activities(s = Season.current)
    # on commence par lister les activité de la personne
    activities = []
    activities << students if try(:students)

    # et on liste ensuite les activités des membres de sa famille
    activities <<
      whole_family(s.id)
        .map(&:students)
        .flatten
        .select { |student| student.activity&.time_interval&.start&.year == s.start.year }

    activities.flatten.uniq
  end

  def get_options
    activity_applications
      .map(&:desired_activities)
      .flatten
      .map(&:options)
    # .flatten
    # .map { |o| o.activity }
  end

  def get_list_of_options
    options = []
    options << get_options

    family_links.each do |fm|
      options << fm.user.get_options if fm.is_paying_for
    end

    options.flatten.uniq
  end

  def is_paying_for?(u = nil, season = Season.current_apps_season)
    cond_h = {
      is_paying_for: true
    }

    cond_h[:user_id] = u.id unless u.nil?

    inverse_family_members.for_season(season).exists?(cond_h)
  end

  # @return [Array<User>]
  def get_users_self_is_paying_for(season = Season.current_apps_season)
    inverse_family_members
      .for_season(season)
      .where(is_paying_for: true)
      .map(&:user)
      .uniq
      .compact
  end

  def any_users_self_is_paying_for?(season = Season.current_apps_season, forever = false)
    query = inverse_family_members
    query = query.for_season(season) unless forever

    query.where(is_paying_for: true)
         .any?
  end

  def get_users_paying_for_self(season = Season.current_apps_season)
    # res = inverse_family_members
    #       .includes(:user)
    #       .where(is_paying_for: true, season: season)
    #       .map(&:user)
    #       .compact
    #       .uniq { |u| "#{u.first_name.downcase} #{u.last_name.downcase}" }
    # fmus = family_member_users.select { |fmu| fmu.season_id == season.id },
    # ifms = inverse_family_members.select { |ifm| ifm.season_id == season.id }

    res = family_member_users
            .for_season(season)
            .where(is_paying_for: true)
            .map { |fm| fm.member }
            .compact

    res << self if is_paying #|| (res.empty? && age >= 18)

    res.uniq(&:id)
  end

  def is_legal_referent?(u = nil, season = Season.current_apps_season)
    cond_h = {
      is_legal_referent: true
    }

    cond_h[:user_id] = u.id unless u.nil?

    inverse_family_members.for_season(season).exists?(cond_h)
  end

  def get_is_legal_referent_users(season = Season.current_apps_season)
    inverse_family_members
      .includes(:user)
      .for_season(season)
      .where(is_legal_referent: true)
      .map(&:user)
      .compact
      .uniq { |u| "#{u.first_name.downcase} #{u.last_name.downcase}" }
  end

  def is_to_call?(u = nil, season = Season.current_apps_season)
    cond_h = {
      is_to_call: true
    }

    cond_h[:user_id] = u.id unless u.nil?

    inverse_family_members.for_season(season).exists?(cond_h)
  end

  def get_is_to_call_users(season = Season.current_apps_season)
    inverse_family_members
      .includes(:user)
      .for_season(season)
      .where(is_to_call: true)
      .map(&:user)
      .compact
      .uniq { |u| "#{u.first_name.downcase} #{u.last_name.downcase}" }
  end

  def get_paying_family_members(season = Season.current_apps_season)
    family_links(season).select(&:is_paying_for)
  end

  def get_first_paying_family_member(season = Season.current_apps_season)
    payers = get_paying_family_members(season).map(&:member)

    payers << self if is_paying

    payers.first
  end

  def age
    # Some user's birthday are null, we might as well consider them adults for our purposes
    # thus the random dateAu
    # ((Time.now - (self.birthday or Time.mktime(1999, 01, 01))) / ActiveSupport::Duration::SECONDS_PER_YEAR).to_i
    bd = (birthday or Date.parse("1990-01-01"))
    d = Date.today
    a = d.year - bd.year
    a -= 1 if bd.month > d.month or
      (bd.month >= d.month and bd.day > d.day)

    a
  end

  # @return [Array<User>]
  # def whole_family(season_id = Season.current_apps_season.id)
  #   # Add condition to return self if more than 18yo
  #   # If self is adult and has no payer link with someone else, self is payer
  #
  #   @users_id_visited = []
  #   @users_id_keep = []
  #
  #   recursive_explore_fmu(season_id, self.id)
  #
  #   users = User.where(id: @users_id_keep).all
  #
  #   if users.empty?
  #     return [self]
  #   else
  #     return users.uniq
  #   end
  # end

  def whole_family(season_id = Season.current_apps_season.id)
    # Add condition to return self if more than 18yo
    # If self is adult and has no payer link with someone else, self is payer

    @visited_users = []
    @family_users = [id]
    @seen_links = []

    visit_user_links id, true, season_id

    users = User.where(id: @family_users).all

    if users.empty?
      return [self]
    else
      return users.uniq
    end
  end

  def get_last_adhesion
    adhesion = adhesions.sort_by(&:validity_start_date).last
    if adhesion.nil?
      nil
    else
      adhesion
    end
  end

  # pour le moment retourne les id des users, en attendant d'avoir les numéros de cotisants
  def get_list_of_adhesions
    # on commence par considérer l'adhésion de la personne
    adhesions = []
    personal = get_last_adhesion
    adhesions << personal.user.id unless personal.nil?

    # et on liste ensuite les adhésions des membres de sa famille
    family_links.each do |fm|
      user = fm.user == self && fm.member || fm.user
      personal = fm.user.get_last_adhesion
      adhesions << personal.user.id if fm.is_paying_for && !personal.nil?
    end

    adhesions.uniq
  end

  def phone_number
    tel = telephones.first&.number&.strip

    return nil if tel.nil?

    unless tel.start_with?("+")
      tel = "+33#{tel[1..-1]}" # TODO: handle other countries
    end

    tel
  end

  def link_to_intervals(intervals_ids)
    intervals_ids.each do |id|
      planning.time_slots.find_or_create_by!(time_interval_id: id)
    end
  end

  def unlink_from_intervals(intervals_ids)
    planning.time_slots.where(time_interval_id: intervals_ids).destroy_all
  end

  #  ==================
  #   AUTHENTICATION
  #  ==================
  def password_required?
    super if confirmed?
  end

  def password_match?
    errors[:password] << "ne peut pas être vide" if password.blank?
    errors[:password_confirmation] << "ne peut pas être vide" if password_confirmation.blank?
    errors[:password_confirmation] << "les deux champs ne correspondent pas" if password != password_confirmation
    password == password_confirmation && !password.blank?
  end

  def attempt_set_password(params)
    p = {}
    p[:password] = params[:password]
    p[:password_confirmation] = params[:password_confirmation]
    update(p)
  end

  def has_no_password?
    encrypted_password.blank?
  end

  def only_if_unconfirmed(&block)
    pending_any_confirmation(&block)
  end

  def update_without_password(params, *options)
    params.delete(:password) if params[:password].present?
    params.delete(:password_confirmation) if params[:password_confirmation].present?

    result = update(params, *options)
    clean_up_passwords
    result
  end

  def class_name
    self.class.name
  end

  def update_levels(levels)
    # Delete missing levels (difference by id between stored levels and request ones)
    to_delete = (self.levels.map(&:id) - levels.reject { |l| l[:isNew] }.map { |l| l[:id] })
    Level.where(id: to_delete).destroy_all

    levels.each do |l|
      # Persist request
      if l[:isNew]
        level = self.levels.create!(l.permit(:activity_ref_id, :evaluation_level_ref_id, :can_continue, :season_id))
        # Update existing level
      elsif l[:isUpdated]
        Level.find(l[:id]).update!(l.permit(:activity_ref_id, :evaluation_level_ref_id, :can_continue, :season_id))
      end
    end
  end

  def generate_default_password
    first_name = self.first_name ? self.first_name.first.downcase : ""
    last_name = self.last_name ? self.last_name.first.downcase : ""
    "#{first_name}#{last_name}#{adherent_number}"
  end

  def set_default_password
    password = generate_default_password
    self.password = password
    self.password_confirmation = password
    save
  end

  def self.find_for_authentication(tainted_conditions)
    find_first_by_auth_conditions(tainted_conditions)
  end

  def send_devise_notification(notification, *args)
    message = devise_mailer.send(notification, self, *args)
    # Remove once we move to Rails 4.2+ only
    if message.respond_to?(:deliver_now)
      message.deliver_now
    else
      message.deliver
    end
  end

  # -----------------------------------
  # override devise::model::recoverable
  # -----------------------------------
  def self.send_reset_password_instructions(attributes = {})
    recoverable = find_for_authentication(attributes) || initialize_with_errors(attributes)
    recoverable.send_reset_password_instructions if recoverable.persisted?
    recoverable
  end

  # override recoverable method, wich set this method to public (from protected)
  def set_reset_password_token
    super
  end

  # TO DO : UPDATE ERROR HANDLING
  def self.initialize_with_errors(_attributes)
    record = new
    record.errors.add(:base, "le compte n'a pas été trouvé en base") # default error handling to adapt here
    record
  end

  #  TEMP methods for "liste états utiles"
  def schedules
    schedules = []

    # self.family_links.each do |fl|
    #     schedules << fl.member.payment_schedule unless !fl.is_paying or fl.member.payment_schedule.due_payments.empty?
    # end

    # for each payer, we find her schedule
    get_users_paying_for_self.each do |payer|
      unless !payer.payment_schedule.nil? and payer.payment_schedule.due_payments.empty?
        schedules << payer.payment_schedule
      end
    end

    # we find the user own payment_schedule
    schedules << payment_schedule unless !payment_schedule.nil? and payment_schedule.due_payments.empty?

    schedules
  end

  def co_payers_due_payments
    if schedules.empty?
      []
    else
      schedules.map { |s| s.due_payments unless s.nil? }.flatten
    end
  end

  def season_teacher_activities(season)
    return Activity.none unless season

    Activity
      .joins(:teachers_activities, :time_interval)
      .where({
               teachers_activities: {
                 user_id: id,
                 is_main: true
               },
               time_intervals: {
                 start: (season.start..season.end)
               }
             })
  end

  def teacher_activity_instances(from_date = Time.now.in_time_zone, to_date = nil)
    qry = ActivityInstance
            .joins(activity: :teachers_activities, time_interval: {})
            .includes(activity: :teachers_activities, time_interval: {})
            .where(
              activity: {
                teachers_activities: {
                  user_id: id,
                  is_main: true
                } })
            .where("start > ?", from_date)

    qry = qry.where('"end" < ? ', to_date) if to_date

    qry
  end

  def has_prolonged_absence(threshold = 3, before = DateTime.now)
    n_last_attendances =
      student_attendances
        .joins(:activity_instance)
        .joins("INNER JOIN time_intervals ON time_intervals.id = activity_instances.time_interval_id")
        .where("time_intervals.start < ?", before)
        .order("time_intervals.start DESC")
        .limit(threshold)

    n_last_attendances
      .select { |a| a.attended.nil? ? 0 : a.attended }
      .length.zero?
  end

  def self.without_payment_schedule
    User.all.select do |u|
      u.schedules.empty? and !u.activities.empty?
    end
  end

  def self.without_adhesion_due_payment
    User.all.select do |u|
      !u.schedules.empty? and u.co_payers_due_payments.count do |dp|
        dp.number.zero? unless dp.nil?
      end.zero? and !u.activities.empty?
    end
  end

  def genitive_first_name
    first_name && (first_name[/^[aeiouAEIOU]/] ? "d'#{first_name}" : "de #{first_name}")
  end

  def has_atelier?
    result = false
    activities.map do |a|
      result = a.activity_ref.kind == "ATELIERS"
    end
    result
  end

  def display_name
    "#{first_name} #{last_name}"
  end

  # For devise validation
  def confirmed?; end

  def confirm(args = {})
    pending_any_confirmation do
      self.confirmed_at = Time.now.utc
      save(validate: args[:ensure_valid] == true)
    end
  end

  private

  def strip_names
    last_name.strip!
    first_name.strip!
    email.strip!
  end

  def create_planning
    self.planning = Planning.create if planning.nil?
  end

  def pending_any_confirmation
    if !confirmed? || pending_reconfirmation?
      yield
    else
      errors.add(:email, :already_confirmed)
      false
    end
  end

  MAX_DEPTH = 4

  private

  def visit_user_links(current_user_id, visit_ascendants, season_id, depth = 0)
    return if depth > 1

    @visited_users << current_user_id

    process_family_member_users(current_user_id, visit_ascendants, season_id, depth)
    process_inverse_family_member_users(current_user_id, visit_ascendants, season_id, depth)
  end

  def process_family_member_users(current_user_id, visit_ascendants, season_id, depth)
    FamilyMemberUser
      .for_season_id(season_id)
      .and!(FamilyMemberUser.where(user_id: current_user_id))
      .pluck(:id, :member_id, :link, :is_paying_for)
      .each do |link_id, member_id, link, is_paying_for|

      next if @seen_links.include?(link_id) || @visited_users.include?(member_id)

      @seen_links << link_id

      is_ascending_link = (link == "mère" || link == "père" || is_paying_for == true)
      is_ascending_link = (is_paying_for == true)
      next if is_ascending_link && !visit_ascendants

      @family_users << member_id
      visit_user_links(member_id, visit_ascendants && is_ascending_link, season_id, depth + 1)
    end
  end

  def process_inverse_family_member_users(current_user_id, visit_ascendants, season_id, depth)
    FamilyMemberUser
      .for_season_id(season_id)
      .and!(FamilyMemberUser.where(member_id: current_user_id))
      .pluck(:id, :user_id, :link, :is_paying_for)
      .each do |link_id, user_id, link, is_paying_for|

      next if @seen_links.include?(link_id) || @visited_users.include?(user_id)

      @seen_links << link_id

      is_ascending_link = (link == "enfant")
      next if is_ascending_link && !visit_ascendants

      @family_users << user_id
      visit_user_links(user_id, true, season_id, depth + 1)
    end
  end

  def recursive_explore_fmu(season_id, current_user_id, student_id = id, deep = 0)
    @users_id_visited << current_user_id

    @users_id_keep << current_user_id unless @users_id_keep.include?(current_user_id)

    is_student = Student.where(user_id: student_id).any?

    FamilyMemberUser
      .for_season_id(season_id)
      .and!(FamilyMemberUser.where(user_id: current_user_id))
      .or(FamilyMemberUser.where(member_id: current_user_id))
      .pluck(:user_id, :member_id)
      .each do |user_id, member_id|

      students = Student.where(user_id: user_id).or(Student.where(user_id: member_id)).pluck(:user_id).uniq

      [user_id, member_id].each do |id|
        next if @users_id_visited.include?(id) || id == current_user_id

        if !is_student && students.include?(id)
          recursive_explore_fmu(season_id, id, student_id, deep + 1)
        else
          @users_id_keep << id unless @users_id_keep.include?(id)
        end
      end
    end
  end
end
