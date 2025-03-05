# == Schema Information
#
# Table name: activities
#
#  id                                  :bigint           not null, primary key
#  created_at                          :datetime         not null
#  updated_at                          :datetime         not null
#  time_interval_id                    :bigint
#  activity_ref_id                     :bigint
#  room_id                             :bigint
#  location_id                         :bigint
#  group_name                          :string
#  evaluation_level_ref_id             :bigint
#  next_season_evaluation_level_ref_id :bigint
#
class UniqGroupName < ActiveModel::Validator
  def validate(record)
    if record.group_name
      season = Season.from_interval(record.time_interval).first
      teacher = record.teacher

      activities_w_same_name = Activity
                                 .joins(:time_interval, :teachers_activities)
                                 .where({ time_intervals: { start: (season.start..season.end) } })
                                 .where(:teachers_activities => { teacher: teacher })
                                 .where(group_name: record.group_name)

      if !activities_w_same_name.empty? && !activities_w_same_name.include?(record)
        record.errors[:base] << "err_group_name_exists"
      end
    end
  end
end

class Activity < ApplicationRecord
  validates_with UniqGroupName

  belongs_to :time_interval
  belongs_to :activity_ref
  belongs_to :room
  belongs_to :location
  belongs_to :next_season_evaluation_level_ref, class_name: "EvaluationLevelRef", required: false
  belongs_to :evaluation_level_ref, required: false

  has_many :students
  has_many :users, through: :students
  has_many :desired_activities
  has_many :options, dependent: :destroy
  has_many :teachers_activities, dependent: :destroy
  has_many :teachers, through: :teachers_activities

  has_many :activity_instances, dependent: :destroy

  has_many :pre_applications, through: :pre_application_activity

  has_many :activities_instruments, dependent: :destroy
  has_many :instruments, through: :activities_instruments

  has_many :student_evaluations

  def self.display_class_name(singular = true)
    singular ? "cours" : "cours"
  end

  def self.class_name_gender
    return :M
  end

  # crée les instances (ActivityInstance) de l'Activity
  # autrement dit les séances du cours
  # **Paramètres**
  # - intervals :
  # Les TimeIntervals qui spécifient les séances de cours à créer sur la saison ;
  # Si omis, la méthode génère les intervalles pour chaque semaine à compter du jour de l'appel, hors jours fériés et vacances
  # - from_date (optionnel) : la date à partir de laquelle on veut créer les séances
  # - to_date (optionnel) : la date jusqu'à laquelle on veut créer les séances
  def create_instances(intervals = [], from_date = nil, to_date = nil)
    # If front doesn't provide intervals for any reason,
    # we need to generate them here
    if intervals.length == 0
      intervals = self.time_interval.generate_for_rest_of_season
    end

    time_interval_instances = []
    time_inter_to_add = []

    intervals.each do |interval|
      # on ne traite pas les intervalles hors plage
      next if from_date.present? && to_date.present? && (
        interval[:start] < from_date ||
          interval[:start] > to_date ||
          interval[:end] < from_date ||
          interval[:end] > to_date)

      if DateTime.parse(interval[:start].to_s).to_date == self.time_interval.start.to_date # we don't want to create a duplicate time_interval
        time_interval_instances << self.time_interval
      else
        new_time_interval = self.time_interval.dup

        start = interval[:start]
        endTime = interval[:end]
        new_time_interval.change_start_and_end(start, endTime)

        new_time_interval.is_validated = true
        new_time_interval.kind = "c"

        time_inter_to_add << new_time_interval
      end
    end

    if time_inter_to_add.length > 0
      TimeInterval.transaction do
        time_intervals = time_inter_to_add.map { |ti|
          ti.attributes.except("id").merge("created_at" => DateTime.now, "updated_at" => DateTime.now)
        }
        time_interval_instances += TimeInterval.where(id: TimeInterval.insert_all(time_intervals)
                                                                      .rows
                                                                      .map { |row| row[0] })
      end
    end

    activity_instance_to_add = []

    time_interval_instances.each do |ti_instance|
      activity_instance = {
        activity_id: self.id,
        time_interval_id: ti_instance.id,
        room_id: self.room_id,
        location_id: self.location_id
      }

      activity_instance_to_add << activity_instance
    end

    ActivityInstance.transaction do
      # @type [ActiveRecord::Result]
      result = ActivityInstance.insert_all!(activity_instance_to_add.map { |ai| ai.except("id").merge("created_at" => DateTime.now, "updated_at" => DateTime.now) })

      self.teacher&.teachers_activity_instances&.insert_all!(result.map { |ai| { activity_instance_id: ai["id"], is_main: true } })
    end

    # Update teacher planning
    # Already done before in time_interval_controller
    self.teacher.planning.time_intervals << time_interval_instances - [self.time_interval]
    self.teacher.planning.save

    time_slots_to_add = []

    self.users.map { |u| u.planning_id }.each do |planning_id|
      time_interval_instances.each do |ti|
        time_slots_to_add << {
          planning_id: planning_id,
          time_interval_id: ti.id,
          created_at: DateTime.now,
          updated_at: DateTime.now
        }
      end
    end

    TimeSlot.transaction do
      TimeSlot.insert_all!(time_slots_to_add) if time_slots_to_add.length > 0
    end

    # We return the time_intervals to help with perfomance in the controller
    time_interval_instances
  end

  # return  the teacher of the activity or nil if none
  # @return [NilClass, User]
  def teacher
    self.teachers_activities.where(is_main: true).map(&:teacher).first
  end

  def season
    Season.from_interval(time_interval).first
  end

  def change_activity_ref(new_activity_ref_id)
    new_activity_ref = ActivityRef.find(new_activity_ref_id)

    if self.activity_ref.id != new_activity_ref_id
      self.activity_ref = new_activity_ref

      # Lorsque l'on change l'activity_ref (1h -> 1h30 par exemple), il est nécessaire
      # de répercuter ce changement sur l'activité souhaité par les élèves déjà assigné
      # pour qu'elle ne disparaisse pas de leur demande
      self.users.each do |user|
        desired = user.activity_application.desired_activities.where(activity_id: self.id)
        desired.update(activity_ref_id: activity_ref.id)
      end

      self.save
    end
  end

  def change_teachers(teachers)
    if !teachers.empty?
      self.remove_teachers
      teachers.each { |id, main| self.add_teacher(id, main) }
    end

    self.save
  end

  def change_teacher(old_id, new_id)
    teachers_activity = self.teachers_activities.find_by(user_id: old_id)
    new_teacher = User.find(new_id)

    if !new_teacher.nil? && new_teacher.is_teacher
      teachers_activity.update!(user_id: new_teacher.id)
    end
  end

  def add_teacher(id, is_main)
    teacher = User.teachers.find(id)

    unless teacher.nil?
      Activity.transaction do
        self.teachers_activities.create(teacher: teacher, is_main: is_main)
        self.teachers.reload

        duration = ((self.time_interval.end - self.time_interval.start) / 3600).round

        self.activity_instances.each do |instance|
          instance.time_interval.plannings.push(teacher.planning)
          duration += (instance.duration / 60).round
        end

        teacher.planning.hours_count += duration
        self.time_interval.plannings.push(teacher.planning)

        teacher.save!
      end
    end
  end

  def remove_teacher(id)
    teacher = self.teachers.find(id)

    if !teacher.nil?
      Activity.transaction do
        self.teachers.destroy(teacher)
        self.time_interval.plannings.destroy(teacher.planning)

        duration = ((self.time_interval.end - self.time_interval.start) / 3600).round

        self.activity_instances.each do |instance|
          instance.time_interval.plannings.destroy(teacher.planning)
          duration += ((instance.time_interval.end - instance.time_interval.start) / 3600).round
        end

        teacher.planning.hours_count -= duration
        teacher.save!
      end
    end
  end

  def remove_teachers
    self.teachers_activities.each do |teacher_activity|
      self.remove_teacher(teacher_activity.user_id)
    end
  end

  def remove_student(desired_activity_id, is_option = false)
    desired_activity = DesiredActivity.includes({
                                                  :activity_application => {
                                                    :user => {},
                                                  },
                                                }).find(desired_activity_id)

    Activity.transaction do
      intervals_to_unlink_user_from = []

      student_user = desired_activity.activity_application.user

      # delete student's attendances from instances
      self.activity_instances.each do |inst|
        # Using a private method to encapsulate the permissible
        inst.student_attendances.where(user: student_user, is_option: is_option || [false, nil]).destroy_all
        intervals_to_unlink_user_from << inst.time_interval_id
      end

      # removing the student from the attendants of the activity
      student_user.unlink_from_intervals(intervals_to_unlink_user_from)

      if is_option
        # delete option only if student is no more in activity
        self.options.where(desired_activity_id: desired_activity_id).destroy_all if self.activities_instruments.where(user: desired_activity.activity_application.user, is_validated: true).none?
      elsif self.users.include?(student_user)
        self.users.delete(student_user.id)
      end

      unless is_option
        # validating desired_activity and setting its activity to current
        desired_activity.is_validated = false
        desired_activity.activity = nil
      end
      desired_activity.save
    end
  end

  def count_active_students(from_date)
    self
      .users
      .to_a
      .select { |u|
        application = u.activity_applications
                       .joins(:desired_activities)
                       .where({
                                :desired_activities => {
                                  :activity_id => self.id,
                                },
                              })
                       .first

        application && (!application.stopped_at || application.stopped_at > from_date) && (!application.begin_at.nil? && application.begin_at <= from_date)
      }
      .count
  end

  # Returns the intended number of lessons for this activity, as defined in its ActivityRef
  # If undefined, defaults to the number of lessons specified for the current season
  # Warning : it may differ from the number of existing activity instances
  # @param [Season] season the season to refer
  # @return [Integer] the intended number of lessons for this activity
  def intended_nb_lessons(season = nil)
    activity_ref.nb_lessons || (season || Season.current)&.nb_lessons || 31
  end

  # Computes and returns the number of existing activity instances for this activity
  # Warning : the result is based on the StudentAttendance model, not on ActivityInstance model
  # @param [Date] from_date the date to count from
  # @return [Integer] the number of existing activity instances for the activity
  def count_lessons(from_date = nil)
    # StudentAttendance
    #   .includes(:activity_instance)
    #   .where(activity_instance: { activity_id: self.id })
    #   .distinct
    #   .count("activity_instance.id")

    query = StudentAttendance
              .joins(activity_instance: :time_interval)
              .where(activity_instance: { activity_id: self.id })

    query = query.where("time_intervals.start > ?", from_date) if from_date

    query.distinct
         .count("activity_instance.id")
  end

  # Computes and returns the number of activity instances of this activity that the specified student was enrolled in
  # @param [Integer] user_id the id of the student to count activity instances for
  # @param [Boolean] is_option count the enrollments where is_option=<tt>is_option</tt>
  # @return [Integer] the number of activity instances that the student was enrolled in
  def count_registered_instances_for_student(user_id, is_option = false)
    StudentAttendance
      .joins(:activity_instance)
      .where(activity_instance: { activity_id: self.id }, user_id: user_id, is_option: is_option)
      .count
  end

  # Computes and returns the number of due activity instances of this activity for the specified student
  # @param [Integer] user_id the id of the student to count activity instances for
  # @return [Integer] the number of activity instances that are due by the student
  def calculate_prorata_for_student(user_id)
    # On calcule le nombre de séances manquées par l'utilisateur
    # (parce qu'il a commencé plus tard que le début des cours ou parce qu'il s'est arrêté plus tôt)

    nb_lessons = count_lessons

    missed_lessons = nb_lessons - count_registered_instances_for_student(user_id)

    # On déduit ce nombre de séances manquées du nombre de séances prévues pour ce cours
    # NB : la référence n'est pas le nombre de séances dans le planning (count(activity_instances))
    # mais le nombre de séances prévues pour l'activité (définition administrative, utilisée pour les calculs
    # des montants dûs)

    intended_lessons = intended_nb_lessons

    if intended_lessons >= nb_lessons
      intended_lessons - missed_lessons
    else
      res = nb_lessons - missed_lessons

      (res.to_f * intended_lessons / nb_lessons).ceil
    end
  end

  def count_active_instruments
    activities_instruments.where.not(user_id: nil).count
  end

  def closest_instance(from_date)
    Elvis::CacheUtils.cache_block_if_enabled("activity:#{self.id}:closest_instance_from:#{from_date.to_date}") do
      # Possiblement plus rapide, mais plus consommateur en mémoire/réseau/CPU du serveur rails
      #self
      #  .activity_instances
      #  .includes(:time_interval)
      #  n'est ps une methode traduite en sql ==> oblige à raméné toutes les instances pour avoir le min
      #  .min_by { |instance| (from_date - instance.time_interval.start).abs }

      self
        .activity_instances
        .joins(:time_interval)
        .includes(:time_interval)
        .select("activity_instances.*, min(abs(EXTRACT(EPOCH FROM ('#{from_date}'::timestamp - time_intervals.start)))) as time_from_date")
        .group("activity_instances.id, time_intervals.id")
        .order("time_from_date")
        .first
    end
  end

  def closest_instance_from_now
    self.closest_instance(DateTime.now)
  end

  def full_periods(period_start, period_end)
    periods = []
    current_start = nil
    current_end = nil

    instances = self
                  .activity_instances
                  .includes(:time_interval)
                  .map { |inst| {
                    :count => inst.active_students.count,
                    :ti_start => inst.time_interval.start,
                    :ti_end => inst.time_interval.end,
                  } }
                  .select { |inst|
                    inst[:ti_start] >= period_start && inst[:ti_end] <= period_end
                  }
                  .sort_by { |ti| ti[:ti_start] }
                  .each do |inst|
      if inst[:count] >= self.activity_ref.occupation_hard_limit
        # lesson is full, begin/continue period
        current_start = inst[:ti_start] if !current_start
        current_end = inst[:ti_end]
      elsif current_start
        # end period and register it
        periods << (current_start..current_end)
        current_start = nil
        current_end = nil
      end
    end

    if current_start && current_end
      periods << (current_start..current_end)
    end

    periods
  end

  def level
    self.users.length > 0 ? self.users.first.levels.find_by(activity_ref_id: self.activity_ref_id).evaluation_level_ref_id : 0
  end
end
