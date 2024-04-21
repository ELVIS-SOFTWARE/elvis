# == Schema Information
#
# Table name: time_intervals
#
#  id           :bigint           not null, primary key
#  start        :datetime
#  end          :datetime
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  kind         :string
#  is_validated :boolean          default(FALSE)
#

class TimeInterval < ApplicationRecord
  # ===========
  # kind
  # ===========
  #   * c = cours
  #   * p = disponibilité
  #   * e = évaluation
  #   * o = option
  #   * d = disponibilité (obsolète)
  # ===========

  # Si le time_interval appartient a une demande d'inscription
  has_one :desired_time_interval

  # Si le time_interval appartient à un planning
  has_many :time_slots, dependent: :destroy
  has_many :plannings, through: :time_slots

  # pratice
  has_one :practice_session

  has_one :activity
  has_one :activity_instance

  has_one :evaluation_appointment

  belongs_to :room, optional: true

  has_one :comment, as: :commentable, dependent: :destroy

  has_many :time_interval_preferences, dependent: :destroy

  scope :in_room, ->(room_id) { joins(:activity_instance).where("activity_instances.room_id = ?", room_id) }
  scope :with_teacher, ->(teacher_id) { joins(:plannings).where(plannings: { user: User.find(teacher_id) }) }

  # renvoie les time_interval qui concernent la saison passée en argument
  scope :for_season, ->(season) { where(
    "tstzrange(?, ?, '[]') @> tstzrange(time_intervals.start, time_intervals.end, '[]')",
    season.first_week_date,
    season.end,
  ) }

  scope :evaluation, -> { where(kind: "e") }

  scope :validated, -> { where(is_validated: true) }
  scope :available, -> { where(is_validated: false) }
  scope :practice, -> { where(kind: "practice") }

  after_destroy :unlink_dependencies

  def self.display_class_name(singular = true)
    singular ? "créneau" : "créneaux"
  end

  def self.class_name_gender
    return :M
  end

  def teacher
    planning = self
                 .plannings
                 .includes(:user)
                 .where({ users: { is_teacher: true } })
                 .first

    return planning&.user
  end

  def generate_over_season(exclude_bank_holidays = false, only_from_now_on = true)
    intervals = []
    season = Season.all.select { |s| (s.start..s.end).include? self.start }.first

    if !season.nil?
      season_start = season.start.to_date
      season_end = season.end.to_date

      if only_from_now_on
        today = Date.today
        season_start = today > season_start ? today : season_start
      end

      cwday = self.start.to_date.cwday
      # We first generate all the corresponding dates over the season
      date_instances = (season_start..(season_end - 1.day)).to_a.select { |date| date.cwday == cwday }

      # We need to remove all that are holidays
      if exclude_bank_holidays
        holiday_dates = season.holidays.select { |h| h.kind != "bank" }.map(&:date)
      else
        holiday_dates = season.holidays.map { |h| h.date }
      end

      date_instances = date_instances.select { |instance| not holiday_dates.include? instance }

      # To obtain the time_intervals, we map the dates to objects with start & end
      date_instances.each do |d|
        start = self.start.to_datetime
        end_date = self.end.to_datetime

        intervals << {
          "start": start.change({ year: d.year, month: d.month, day: d.day }),
          "end": end_date.change({ year: d.year, month: d.month, day: d.day }),
        }
      end

      return intervals
    else
      return []
    end

  end

  def change_start_and_end(new_start, new_end)
    self.start = self.start.change(year: new_start.year, month: new_start.month, day: new_start.day, hour: new_start.hour, min: new_start.min)
    self.end = self.end.change(year: new_end.year, month: new_end.month, day: new_end.day, hour: new_end.hour, min: new_end.min)
  end

  def generate_for_rest_of_season
    self.generate_over_season(true, false).select { |ti| ti[:start] >= self.start }
  end

  def contains?(date)
    self.start <= date && date <= self.end
  end

  def check_for_conflict(teacher, room)
    season = Season.from_interval(self).first

    holiday_dates = season.holidays.map { |h| h.date }

    room_conflict = self.overlap_room(room.id)
    teacher_conflict = self.overlap_teacher(teacher.id)

    holiday_conflict = holiday_dates.include?(self.start.to_date)

    if !room_conflict.nil?
      return 'room'
    elsif !teacher_conflict.nil?
      return 'teacher'
    elsif holiday_conflict
      return 'holiday'
    else
      return false
    end
  end

  def overlap_room(room_id)
    potential_overlaps = TimeInterval.in_room(room_id)

    season = Season.from_interval(self).first

    if !season.nil?
      potential_overlaps = potential_overlaps.where(start: (season.start..season.end))
    end

    return potential_overlaps.find {
      |suspect|
      self.overlap_in_any_way?(suspect)
    }
  end

  def overlap_room_over_weeks(teacher_id, from_date, to_date)

    from_date = Time.zone.at(from_date.to_time.to_i)
    to_date = Time.zone.at(to_date.to_time.to_i)

    overlap = nil

    # on génère tous les intervalles en excluant les jours fériés et les vacances scolaires
    tis = self.generate_over_season(true, false)

    # on vérifie la disponibilité du prof sur chacun des intervalles
    tis.each do |_ti|
      if _ti[:start] >= from_date && _ti[:end] <= to_date
        ti = TimeInterval.new(start: _ti[:start], end: _ti[:end])
        overlap = ti.overlap_room(teacher_id)

        # on s'arrête dès qu'on a trouvé une indisponibilité
        break if overlap
      end
    end

    overlap
  end

  def overlap_teacher(teacher_id)
    season = Season.from_interval(self).first

    potential_overlaps = TimeInterval.with_teacher(teacher_id).where(is_validated: true)

    if !season.nil?
      potential_overlaps = potential_overlaps.where(start: (season.start..season.end))
    end

    return potential_overlaps.find do |suspect|
      self.overlap_in_any_way?(suspect)
    end
  end

  def overlap_teacher_over_weeks(teacher_id, from_date, to_date)
    overlap = nil

    # on génère tous les intervalles en excluant les jours fériés et les vacances scolaires
    tis = self.generate_over_season(true, false)

    # on vérifie la disponibilité du prof sur chacun des intervalles
    tis.each do |_ti|
      if _ti[:start] >= from_date && _ti[:end] <= to_date
        ti = TimeInterval.new(start: _ti[:start], end: _ti[:end])
        overlap = ti.overlap_teacher(teacher_id)

        # on s'arrête dès qu'on a trouvé une indisponibilité
        break if overlap
      end
    end

    overlap
  end

  def overlap_in_any_way?(int)

    if int.id == self.id
      return false
    end

    # First we extract the time from the intervals
    self_start = self.start
    self_end = self.end
    self_iso = self.start.wday
    int_start = int.start
    int_end = int.end
    int_iso = int.start.wday

    # Then we check if the two intervals overlap in any way.
    # In our case, a matching starting OR ending time do not
    # correspond to an overlap.
    return self_iso == int_iso && self_start < int_end && int_start < self_end
  end

  def overlap_completely?(int)
    # First we extract the time from the intervals
    self_start = self.start.in_time_zone("Europe/Paris").strftime("%H:%M")
    self_end = self.end.in_time_zone("Europe/Paris").strftime("%H:%M")
    self_iso = self.start.wday

    int_start = int.start.in_time_zone("Europe/Paris").strftime("%H:%M")
    int_end = int.end.in_time_zone("Europe/Paris").strftime("%H:%M")
    int_iso = int.start.wday

    # Then we check if the interval (self) completely "wraps" the compared interval (int).
    # In this case, the starting or ending times can (and should) be identical.
    result = self_iso == int_iso && self_start <= int_start && self_end >= int_end
    return result
  end

  # Performs a difference between two intervals
  # 4 cases can be identified for this operation:
  #   1- base interval covers cutting interval
  #   2- base interval overlaps with cutting interval
  #   3- base interval doesn't overlap with cutting interval
  #   4- cutting interval covers base interval
  def difference(int)
    # case 1
    if self.overlap_completely?(int)
      # base interval is cut in two
      #   |___________|
      # -     |___|     FULL COVERING
      # = |___| + |___|
      [
        TimeInterval.new(start: self.start, end: int.start),
        TimeInterval.new(start: int.end, end: self.end),
      ]
    elsif int.overlap_completely?(self)
      # we return empty interval,
      # because base interval has been completely cut
      #       |___|
      # - |___________| FULLY COVERED
      # = Ø (empty interval)
      []
    elsif self.overlap_in_any_way?(int)
      # check which part of interval is overlapping
      #      |___________|
      # - |_____|           LEFT OVERLAP
      # =       |________|
      # ++++++++++++++++++++++++++++++++++++++++
      #   |___________|
      # -        |_______| RIGHT OVERLAP
      # = |______|
      overlap_left = int.end <= self.end
      res_start = overlap_left ? int.end : self.start
      res_end = overlap_left ? self.end : int.start

      [TimeInterval.new(start: res_start, end: res_end)]
    else
      # no overlap, interval is untouched
      #   |___|
      # -        |_______| NO OVERLAP
      # = |___|
      [self]
    end
  end

  def matching_intervals(act_ref, busy = TimeInterval.none, season)
    # On prend la liste des intervalles inclus dans le créneau de dispo,
    # tout en filtrant les intervalles déjà pris par une activité
    query = TimeInterval
              .validated
              .where(start: (season.start..season.end))
              .includes({ :activity => { :activity_ref => :activity_ref_kind } })
              .joins({ :activity => { :activity_ref => :activity_ref_kind } })

    if act_ref.activity_type == "child"
      query = query.where("activity_refs.id = ?", act_ref.id)
    else
      query = query.where("activity_ref_kinds.name = ?", act_ref.kind)
    end

    query.select do |i|
      self.to_iso.overlap_completely?(i.to_iso) &&
        busy.find_index { |b| i.to_iso.overlap_in_any_way?(b.to_iso) }.nil?
    end
  end

  def iso_equal(other)
    self.start.wday == other.start.wday &&
      self.start.hour == other.start.hour &&
      self.start.min == other.start.min &&
      self.end.wday == other.end.wday &&
      self.end.hour == other.end.hour &&
      self.end.min == other.end.min
  end

  ISO_YEAR = 2000
  ISO_WEEK = 1

  # Get a week independent time interval
  # So that only time parts (hour, minute, second...)
  # in overlap methods.
  # (set same year and week for all iso intervals)
  def to_iso
    iso_start_date = Date.strptime("#{ISO_YEAR}-#{ISO_WEEK}-#{self.start.wday}", "%G-%W-%w")
    iso_end_date = Date.strptime("#{ISO_YEAR}-#{ISO_WEEK}-#{self.end.wday}", "%G-%W-%w")
    DateTime.now.wday
    iso_start = self.start.change(year: iso_start_date.year, month: iso_start_date.month, day: iso_start_date.day)
    iso_end = self.end.change(year: iso_end_date.year, month: iso_end_date.month, day: iso_end_date.day)

    TimeInterval.new(start: iso_start, end: iso_end)
  end

  def convert_to_first_week_of_season(season, ensure_day_in_season = true)
    return if self.activity || self.activity_instance

    new_start = season.start.beginning_of_week + (self.start.wday-1).days + self.start.hour.hours + self.start.min.minutes
    new_end = season.start.beginning_of_week + (self.end.wday-1).days  + self.end.hour.hours + self.end.min.minutes

    new_start += 1.week if new_start < season.start && ensure_day_in_season
    new_end += 1.week if new_end < season.start && ensure_day_in_season

    self.start = new_start
    self.end = new_end
  end

  def unlink_dependencies
    appointment = EvaluationAppointment.find_by(time_interval_id: self.id)
    appointment.update({ time_interval_id: nil, teacher_id: nil }) unless appointment.nil?
  end

  def check_and_adjust_range(from_date, to_date)
    season = Season.from_interval(self).first
    # convert_to_first_week_of_season(season)

    if from_date
      from_date = season.start if from_date < season.start || from_date > season.end
    else
      from_date = season.start
    end

    if to_date
      to_date = season.end if to_date < season.start || to_date > season.end
    else
      to_date = season.end
    end

    { from_date: from_date, to_date: to_date }
  end

  # is other intervals sticker to self (end or start)
  def sticked?(other)
    self.end == other.start || other.end == self.start
  end

  # Fusionne l'intervalle avec un autre intervalle s'ils sont adjacents
  # @return [TimeInterval] un nouvel intervalle fusionné ; nil s'ils ne sont pas adjacents
  def merge_sticked(other)
    return nil unless self.sticked?(other)

    new_interval = TimeInterval.new

    new_interval.start = other.start > self.start ? self.start : other.start
    new_interval.end = other.end > self.end ? other.end : self.end

    new_interval
  end

  # Fusionne les intervalles qui sont adjacents
  # @param [Array<TimeInterval>] intervals tableau d'intervalles à fusionner
  # @return [Array<TimeInterval>] un nouveau tableau d'intervalles dont les intervalles adjacents ont été fusionnés
  def self.merge_sticked(intervals)
    while intervals.any? { |ti| intervals.any? { |ti2| ti.sticked?(ti2) } }
      merged = intervals.map do |interval|
        intervals.map { |ava| interval.merge_sticked(ava) }.filter { |ava| ava.present? }.uniq
      end.flatten.uniq { |av| av.start + av.end }

      intervals = intervals.filter { |av| !merged.any? { |ava| ava.overlap_completely?(av) } } + merged
    end
    intervals
  end
end
