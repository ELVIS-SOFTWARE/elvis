require "csv"

class AbsencesController < ApplicationController
  DAYS_FR = %w[Dimanche Lundi Mardi Mercredi Jeudi Vendredi Samedi].freeze

  # Global absence tracking page ("Suivi des absences")
  def index
    @current_user = current_user
    authorize! :manage, @current_user.is_admin

    @seasons = Season.order_by_start.select(:id, :label, :is_current, :start, :end)
    @teachers = User.where(is_teacher: true)
                    .order(last_name: :asc, first_name: :asc)
                    .select(:id, :first_name, :last_name)
    @activities = ActivityRef.order(label: :asc).select(:id, :label)
  end

  # JSON endpoint returning the flat list of absences for the selected season/range.
  # Grouping (élève > jour > cours) and KPIs are computed client-side.
  def data
    authorize! :manage, current_user.is_admin

    season = params[:season_id].present? ? Season.find(params[:season_id]) : Season.current_apps_season
    render json: { absences: [], season: nil } and return if season.nil?

    range_start = parse_date(params[:start]) || season.start
    range_end = parse_date(params[:end]) || season.end

    render json: { absences: serialize_absences(absences_scope(season, range_start, range_end)) }
  end

  # CSV export of the currently filtered absences.
  def export
    authorize! :manage, current_user.is_admin

    season = params[:season_id].present? ? Season.find(params[:season_id]) : Season.current_apps_season
    range_start = parse_date(params[:start]) || season&.start
    range_end = parse_date(params[:end]) || season&.end

    rows = season.nil? ? [] : serialize_absences(absences_scope(season, range_start, range_end))

    csv = CSV.generate(headers: true, col_sep: ";") do |out|
      out << ["Élève", "N° adhérent", "Jour", "Cours / activité", "Professeur", "Date", "Type", "Remarque"]
      rows.each do |a|
        out << [
          a[:student][:full_name],
          a[:student][:adherent_number],
          a[:day],
          a[:activity],
          a[:teacher],
          a[:date],
          a[:justified] ? "Justifiée" : "Injustifiée",
          a[:remarks],
        ]
      end
    end

    send_data csv, filename: "suivi_absences_#{Date.today.strftime('%Y%m%d')}.csv", type: "text/csv"
  end

  private

  def parse_date(value)
    return nil if value.blank?

    Date.strptime(value, "%Y-%m-%d")
  rescue ArgumentError
    nil
  end

  def absences_scope(season, range_start, range_end)
    scope = StudentAttendance
              .joins(:activity_instance)
              .joins("INNER JOIN time_intervals ON activity_instances.time_interval_id = time_intervals.id")
              .joins("INNER JOIN activities ON activity_instances.activity_id = activities.id")
              .joins("INNER JOIN activity_refs ON activities.activity_ref_id = activity_refs.id")
              .joins("INNER JOIN teachers_activities ON activities.id = teachers_activities.activity_id")
              .joins("INNER JOIN users teachers ON teachers_activities.user_id = teachers.id")
              .where("attended != 1")
              .where("time_intervals.start >= :start", start: range_start)
              .where("time_intervals.start <= :end", end: range_end)
              .order("time_intervals.start DESC")
              .includes(
                user: {},
                activity_instance: {
                  activity: { activity_ref: {}, teachers_activities: :teacher },
                  time_interval: {},
                }
              )

    if params[:teacher_id].present?
      scope = scope.where("teachers.id = :tid", tid: params[:teacher_id])
    end

    if params[:activity_ref_id].present?
      scope = scope.where("activity_refs.id = :aid", aid: params[:activity_ref_id])
    end

    if params[:type].present? && params[:type] != "all"
      scope = params[:type] == "justified" ? scope.where(attended: 3) : scope.where.not(attended: 3)
    end

    scope
  end

  def serialize_absences(scope)
    scope.map do |abs|
      instance = abs.activity_instance
      start = instance.time_interval.start.in_time_zone("Europe/Paris")
      student = abs.user
      teacher = instance.activity.teacher

      {
        id: abs.id,
        date: start.strftime("%d/%m/%Y"),
        date_iso: start.strftime("%Y-%m-%d"),
        day: DAYS_FR[start.wday],
        activity: instance.activity.activity_ref&.label,
        activity_ref_id: instance.activity.activity_ref_id,
        teacher: teacher&.full_name,
        teacher_id: teacher&.id,
        justified: abs.attended == 3,
        remarks: abs.remarks,
        student: {
          id: student.id,
          full_name: student.full_name,
          first_name: student.first_name,
          last_name: student.last_name,
          adherent_number: student.adherent_number,
          avatar_url: student.avatar_url,
          sex: student.sex,
        },
      }
    end
  end
end
