# == Schema Information
#
# Table name: activity_applications
#
#  id                             :bigint           not null, primary key
#  user_id                        :bigint
#  created_at                     :datetime         not null
#  updated_at                     :datetime         not null
#  activity_application_status_id :bigint
#  deleted_at                     :datetime
#  season_id                      :bigint
#  mail_sent                      :boolean          default(FALSE)
#  status_updated_at              :datetime
#  referent_id                    :bigint
#  stopped_at                     :datetime
#  begin_at                       :datetime
#  reason_of_refusal              :string
#

class ActivityApplication < ApplicationRecord
  update_index("activity_applications") { self } # specifying index, type and back-reference for updating
  # after user save or destroy

  def run_chewy_callbacks
    base_chewy_callbacks
  end

  acts_as_paranoid
  before_update :refresh_status_updated_at

  belongs_to :user
  belongs_to :user_csv, -> { select(:id, :adherent_number, :birthday, :first_name, :last_name, :email) }, class_name: "User", required: false
  belongs_to :season, optional: true
  belongs_to :season_csv, -> { select(:id, :label) }, class_name: "Season", optional: true

  has_many :desired_activities, dependent: :destroy
  has_many :desired_activities_csv, -> { select(:id, :activity_application_id, :activity_ref_id) }, class_name: "DesiredActivity"
  has_many :activity_refs, through: :desired_activities

  has_many :comments, as: :commentable
  has_many :comments_csv, -> { select(:id, :content, :commentable_id, :user_id) }, class_name: "Comment", as: :commentable

  belongs_to :activity_application_status
  # belongs_to :activity_application_status_csv, -> { select(:id, :label) }, class_name: "ActivityApplicationStatus", required: false

  has_one :pre_application_activity # dependent: :destroy #, optional: true
  has_one :pre_application_activity_csv, -> { select(:id, :action, :activity_application_id) }, class_name: "PreApplicationActivity" # dependent: :destroy #, optional: true

  has_one :pre_application_desired_activity # dependent: :destroy #, optional: true
  has_one :pre_application_desired_activity_csv, -> { select(:id, :action, :activity_application_id) }, class_name: "PreApplicationDesiredActivity", required: false # dependent: :destroy #, optional: true

  has_many :time_interval_preferences

  belongs_to :referent, class_name: :User, optional: true

  has_many :evaluation_appointments, dependent: :destroy

  has_many :time_interval_preferences, dependent: :destroy

  scope :for_activity_id, ->(activity_id) { joins(:desired_activities).where(desired_activities: { activity_id: activity_id }) }

  def self.display_class_name(singular = true)
    singular ? "demande d'inscription" : "demandes d'inscription"
  end

  def self.class_name_gender
    return :F
  end

  def add_activity(activity_ref_id, additional_student = nil)
    activity_ref = ActivityRef.find(activity_ref_id)

    desired_activity = DesiredActivity.new(activity_ref: activity_ref)

    self.desired_activities << desired_activity

    AdditionalStudent.create(desired_activity: desired_activity, user: additional_student) unless additional_student.nil?

    # If no NewStudentLevelQuestionnaire exists for the specified activity, user, and season,
    # check if the user lacks a level for the activity. If so, create a new level for the user.
    unless NewStudentLevelQuestionnaire.exists?(activity_ref_id: activity_ref.id, user_id: self.user_id, season_id: self.season_id)
      if self.user.levels.find_by(activity_ref_id: activity_ref.id).nil?
        user.levels << Level.new(activity_ref_id: activity_ref.id, season_id: self.season_id, evaluation_level_ref_id: EvaluationLevelRef.first&.id)
      end
    end


  end

  def add_activities(activity_ref_ids, additional_students, family)
    activity_ref_ids.each do |activity_ref_id|

      # Getting the parameter linked to the activity if it exists
      idx = additional_students.index { |p| p[0] == activity_ref_id } unless additional_students.nil?

      additional_student = nil

      unless idx.nil?
        # parameter = additional_students.delete_at(ind)[1]
        additional_student_id = additional_students[idx][1]

        additional_student = family.select { |u| u.id == additional_student_id.to_i }.first
      end

      self.add_activity(activity_ref_id, additional_student)
    end
  end

  # Retourne la liste des disponibilités renseignées par l'utilisateur
  # * les créneaux de cours pour l'activité choisie, si c'est une activité qui autorise le choix de créneau
  # * les disponibilités renseignées, sinon
  # @return [Array<TimeInterval>] les disponibilités correspondantes
  def availabilities(include_validated: false)
    if self.desired_activities.joins(:activity_ref).where(activity_refs: { allows_timeslot_selection: true }).any?
      self
        .time_interval_preferences
        .includes(:time_interval)
        .order(:rank)
        .map(&:time_interval)
        .compact

    else
      query = self
                .user
                .planning
                .time_intervals
                .where(start: self.season.start..self.season.end)

      (include_validated ? query : query.where(is_validated: false)).to_a
    end
  end

  def remove_desired_activity_by_id(activity_id)
    desired_activity = DesiredActivity.includes(:additional_student).find(activity_id)
    unless desired_activity.additional_student.nil?
      desired_activity.additional_student.delete()
    end

    self.desired_activities.delete(desired_activity)
  end

  def refresh_status_updated_at
    if self.activity_application_status_id_changed?
      self.status_updated_at = Time.now
    end
  end

  def undeletable_instruction(source_object = nil)
    case source_object.class.to_s
    when User.to_s
      { instruction: "supprimer la demande d'inscription numéro #{id} ", possible: true }
    else
      super
    end
  end

  def self.destroy_params
    base_params = ApplicationRecord.destroy_params

    base_params.merge({
                        auto_deletable_references: [DesiredActivity, TimeIntervalPreference],
                        ignore_references: [User, PreApplicationActivity, PreApplicationDesiredActivity],
                        success_message: success_message
                      })
  end

  def self.dependant
    "ActivityApplication"
  end

  def pre_destroy
    # get current_user if destroy job called from a controller
    current_user = RequestStore.read(:request)&.controller_instance&.current_user

    # if user is not admin or destroy request not coming from a controller
    unless current_user&.is_admin
      set_status = Parameter.find_by(label: "activityApplication.default_status")

      default_activity_status_id = set_status&.parse&.positive? ? set_status.parse : ActivityApplicationStatus::TREATMENT_PENDING_ID

      raise "La demande d'inscription ne peut être supprimée, car l'administration traite ou à traiter cette demande." if self.activity_application_status_id != default_activity_status_id
    end

    self.pre_application_activity.reset if self.pre_application_activity
  end
end
