# frozen_string_literal: true

require "rqrcode"

class UsersController < ApplicationController
  skip_before_action :authenticate_user!, only: %i[exist edit_password update_password]
  skip_before_action :verify_authenticity_token, only: [:exist]
  before_action :wrap_in_sign_in_token, only: :new_application

  def current_user_root
    #  We use a custom controller action to route based on ability,
    # An admin doesn't have the same home than a mere user.
    # cf config/routes.rb

    if current_user.teacher?
      redirect_to planning_simple_path
    elsif can? :manage, :all
      redirect_to users_path
    else
      redirect_to my_activity_path(current_user.id)
    end
  end

  def first_login
    render layout: "devise"
  end

  def update_email
    user = current_user
    user.email = params[:user][:email]
    return unless user.save

    token = user.set_reset_password_token
    redirect_to edit_password_path({ format: user.id, reset_password_token: token })
  end

  def edit_password
    @user = User.find(params[:format])
    @token = params[:reset_password_token]
    @has_token = !@user.reset_password_token.nil?
    render layout: "devise"
  end

  def update_password
    @user = User.with_reset_password_token(params[:reset_password_token])
    if @user&.reset_password_period_valid?
      if @user.reset_password(params[:user][:password], params[:user][:password_confirmation])
        sign_out(@user)
        sign_in(@user)
        redirect_to root_url
      else
        @token = params[:reset_password_token]
        @has_token = !@user.reset_password_token.nil?
        render :edit_password, layout: "devise"
      end
    else
      render plain: "Jeton de réinitialisation inconnu ou expiré"
    end
  end

  def create_account
    @user = User.find params[:id]
    @current_user = @user
  end

  def save_new_account
    user = User.find params[:id]
    user.email = params[:user][:email] if user.attached_to.nil? || user.attached_to.email != params[:user][:email]
    user.reset_password(params[:user][:password], params[:user][:password_confirmation])
    user.first_connection = false

    user.save

    sign_in(user, bypass: true) # HERE
    redirect_to new_application_path(user)
  end

  def infos
    user = User
             .includes(
               :telephones,
               :addresses,
               :attached_to,
               family_member_users: {
                 member: %i[addresses telephones]
               },
               inverse_family_members: {
                 user: %i[addresses telephones]
               }
             )
             .find(params[:id])

    authorize! :read, user

    res = user.as_json({
                         include: {
                           telephones: {},
                           addresses: {}
                         },
                         methods: :family_links_with_user
                       })

    render json: res
  end

  def index
    @filter = params[:role]
    @current_user = current_user

    @filter = "" if @filter.nil? # evite une erreur de react (select sans valeurs)

    authorize! :manage, @current_user.is_admin
    respond_to do |format|
      format.html

      format.csv do
        model_name = "User"
        default_serializer = "Templates::#{model_name}Serializer".constantize

        template_name = params[:template]&.to_sym
        template_content = ExportTemplate.find_by(model: model_name, name: template_name)&.content

        query = model_name.constantize.all

        filename = "EXPORT_utilisateurs_#{Time.now.strftime('%Y/%m/%d-%H:%M:%S')}.csv"

        render csv: query, filename: filename, serializer: default_serializer, stream: false
      end
    end
  end

  def simple_list
    query = User.all
                .left_joins(:telephones, :addresses, :organization)
                .includes(:telephones, :addresses, :organization)
                .as_json(include: [:telephones, :addresses, :organization])
    respond_to do |format|
      format.csv { render plain: users_list_csv(query), content_type: "text/csv" }
      format.json { render json: { users: query } }
    end
  end

  def list
    query = User.includes(%i[planning adhesions activities])
    params[:filtered].each do |filter|
      case filter[:id]
      when "role"
        case filter[:value]
        when "user"
          query = query.not_admins.not_students.not_teachers.not_members
        when "student"
          query = query.students
        when "adherent"
          query = query.members.not_students
        when "teacher", "admin"
          query = query.where("is_#{filter[:value]} = true")
        else
          # type code here
        end
      when "adherent_number"
        query = query.where("adherent_number = ?", filter[:value].to_i)
      when "attached"
        query = filter[:value] == "true" ? query.where(attached_to_id: nil) : query.where.not(attached_to_id: nil) unless "#{filter[:value]}".empty?
      else
        query = query.where("#{filter[:id]} ILIKE ?", "#{filter[:value]}%")
      end
    end

    respond_to do |format|
      format.csv do
        model_name = controller_name.classify
        default_serializer = "Templates::#{model_name}Serializer".constantize

        query = User.includes(%i[planning adhesions telephones addresses consent_document_users]).all
        filename = "Export_utilisateurs_#{Time.now.strftime('%Y%m%d-%H%M%S')}.csv"

        render csv: query, filename: filename, serializer: default_serializer, stream: false
      end
      format.json { render json: users_list_json(query, params) }
    end
  end

  def list_schedules
    season_param = params[:filtered].select { |f| f[:id] == "season" }.first[:value].to_i

    query = User.includes(:payment_schedules)
                .where("(
                    -- no schedule for the season
                    SELECT COUNT(*)
                    FROM payment_schedules ps
                    WHERE ps.season_id = :sid
                    AND ps.payable_id = users.id
                    AND ps.payable_type = 'User'
                ) = 0
                AND ((
                    -- are paying for a student of this season
                    SELECT COUNT(*)
                    FROM family_member_users fms
                    INNER JOIN users paid ON paid.id = fms.user_id
                    INNER JOIN activity_applications apps ON apps.user_id = paid.id
                    INNER JOIN desired_activities des ON des.activity_application_id = apps.id
                    WHERE fms.deleted_at IS NULL
                    AND fms.member_id = users.id
                    AND fms.is_paying_for
                    AND apps.deleted_at IS NULL
                    AND apps.season_id = :sid
                    AND des.deleted_at IS NULL
                    AND des.is_validated
                ) > 0
                OR (
                    -- are eighteen or more
                    extract(year from age(users.birthday)) > 18
                    AND (
                        -- have no one paying for them
                        SELECT COUNT(*)
                        FROM family_member_users fms
                        WHERE fms.deleted_at IS NULL
                        AND fms.user_id = users.id
                        AND fms.is_paying_for
                    ) = 0
                    AND (
                        -- are students of this season
                        SELECT COUNT(*)
                        FROM activity_applications apps
                        JOIN desired_activities des ON des.activity_application_id = apps.id
                        WHERE apps.deleted_at IS NULL
                        AND apps.user_id = users.id
                        AND apps.season_id = :sid
                        AND des.deleted_at IS NULL
                        AND des.is_validated
                    ) > 0
                ))", sid: season_param)

    params[:filtered].each do |filter|
      prop = filter[:id]
      val = filter[:value]

      query = query.where("first_name ILIKE :val OR last_name ILIKE :val", { val: "#{val}%" }) if prop == "name"
    end

    total = query.count

    query = query
              .page(params[:page] + 1)
              .per(params[:pageSize])

    if params[:sorted]
      query = query.order(Arel.sql("(users.first_#{params[:sorted][:id]} || users.last_#{params[:sorted][:id]}) #{params[:sorted][:desc] ? 'desc' : 'asc'}"))
    end

    pages = query.total_pages
    render json: {
      users: query.as_json(include: :payment_schedules),
      pages: pages,
      total: total
    }
  end

  def show
    @tab = params[:tab]

    # Check if season is open for pre-register
    @season = Season.current
    # pre_register_date = @season.opening_date_for_applications
    # pre_register_closing_date = @season.closing_date_for_applications
    # today = Date.today
    # @is_open_for_pre_register = false

    # if today < pre_register_date || today > pre_register_closing_date
    #   @is_open_for_pre_register = false
    # end

    # if today > pre_register_date && today < pre_register_closing_date
    #   @is_open_for_pre_register = true
    # end

    @user = User.includes(:adhesions, :addresses).find(params[:id])
    @user_json = @user.as_json({
                                 include: {
                                   telephones: {},
                                   addresses: { only: %i[id street_address country department postcode city] },
                                   levels: { include: %i[evaluation_level_ref activity_ref] }
                                 },
                                 methods: :family_links_with_user,
                                 except: %i[authentication_token]
                               })
    authorize! :read, @user

    fml = @user.family_links(@season)

    user_to_exclude_from_attached = fml.map(&:member_id) + fml.map(&:user_id)
    attached_account_to_show = @user.attached_accounts.where.not(id: user_to_exclude_from_attached)

    @users_to_show_in_family_list = @user
                                      .family(@season)
                                      .uniq
                                      .map { |u| {user: u, fml: u.family_link_with(@user, @season), attached_to: u.attached_to}}
                                      .sort_by { |d| -2 * (d.dig(:fml)&.is_to_call || false).to_i - (d.dig(:fml)&.is_paying_for || false).to_i }
    @users_to_show_in_family_list += attached_account_to_show.map { |u| {user: u, fml: nil, attached_to: u.attached_to} }

    @adhesion = @user.get_last_adhesion
    @distance_to_end_date = nil

    unless @adhesion.nil?
      @distance_to_end_date = (@user.get_last_adhesion.validity_end_date.to_date - DateTime.now.to_date).to_f
    end

    @any_abs = @user
                 .student_attendances
                 .joins(:activity_instance)
                 .joins("INNER JOIN time_intervals ON activity_instances.time_interval_id = time_intervals.id")
                 .where("attended != 1")
                 .any?

    @activities = @user
                    .activity_applications
                    .includes({
                                desired_activities: {
                                  activity: {
                                    room: {},
                                    activity_instances: [],
                                    time_interval: {},
                                    teachers_activities: {},
                                    activity_ref: {}
                                  }
                                }
                              })
                    .select { |app| app.desired_activities.where(is_validated: true).any? }
                    .group_by(&:season_id)
                    .transform_values { |apps| apps.map(&:desired_activities).flatten.map(&:activity).compact }
                    .transform_keys { |k| Season.find(k) }
                    .entries
                    .sort_by { |e| e.first.end }
                    .reverse
                    .to_h

    # on doit ajouter ici les activités liées à des packs
    # qui ne font pas l'objet d'une inscription (activity_application)
    activity_refs = ActivityRef
                      .includes(activity_ref_pricing: :pricing_category)
                      .includes(activities: :students)
                      .joins(activities: :students)
                      .where("pricing_categories.is_a_pack = true")
                      .where("students.user_id=?", @user.id)

    activities = activity_refs
                   .map(&:activities)
                   .flatten
    #.uniq { |act| act.id}

    # group activities by season
    activities = activities.group_by{|act| act.season.id}
    # add these activities to the &activities hash
    activities.each do |season_id, acts|
      season = Season.find(season_id)
      @activities[season] = [] if @activities[season].nil?
      @activities[season] += acts
      @activities[season].uniq! { |act| act.id}
    end

    @applications = @user
                      .activity_applications
                      .includes({
                                  desired_activities: {
                                    activity: {}
                                  }
                                })
                      .select { |app| app.desired_activities.where(is_validated: true).any? }
                      .group_by { |app| app.desired_activities.map(&:activity).compact.map(&:id) }
                      .transform_values(&:first)

    @seasons = Season.all.select(:id, :label, :is_current)

    @age = if @user.birthday.nil?
             nil
           else
             @user.age
           end
  end

  def list_abscences
    user = User.find(params[:id])
    # @type Season
    @season = params[:sid].nil? ? Season.current_apps_season : Season.find(params[:sid])

    render json: [], status: :ok and return if @season.nil?

    absences = user
                 .student_attendances
                 .joins(:activity_instance)
                 .joins("INNER JOIN time_intervals ON activity_instances.time_interval_id = time_intervals.id")
                 .joins("INNER JOIN activities ON activity_instances.activity_id = activities.id")
                 .joins("INNER JOIN activity_refs ON activities.activity_ref_id = activity_refs.id")
                 .joins("INNER JOIN teachers_activities ON activities.id = teachers_activities.activity_id")
                 .joins("INNER JOIN users teachers ON teachers_activities.user_id = teachers.id")
                 .where("attended != 1")
                 .where("time_intervals.start >= :start", start: @season.start)
                 .where("time_intervals.start <= :end", end: @season.end)
                 .order("time_intervals.start DESC")
                 .includes({
                             activity_instance: {
                               activity: {
                                 activity_ref: {},
                                 teachers_activities: :teacher
                               },
                               time_interval: {}
                             }
                           })

    params[:filtered].each do |filter|
      next if filter[:value].nil?

      case filter[:id]
      when "date"
        date = Date.strptime(filter[:value], "%Y-%m-%d")

        absences = absences.where("Date(time_intervals.start) = :year", year: date)
      when "teacher"
        absences = absences.where("LOWER(teachers.last_name) like '%#{filter[:value].downcase}%' or LOWER(teachers.first_name) like '%#{filter[:value].downcase}%'")
      when "activity"
        absences = absences.where("LOWER(activity_refs.label) like '%#{filter[:value].downcase}%'")
      when "type"
        filter[:value] = nil if filter[:value] == -1
        absences = absences.where(attended: filter[:value]) unless filter[:value] == "all"
      end
    end

    sort_order = params[:sorted][:desc] ? :desc : :asc
    total = absences.count

    case params[:sorted][:id]
    when "date"
      absences = absences.order("time_intervals.start #{sort_order}")
    when "teacher"
      absences = absences.order("teachers.first_name #{sort_order}")
                         .order("teachers.last_name #{sort_order}")
    when "activity"
      absences = absences.order("activity_refs.label #{sort_order}")
    end

    absences = absences.page(params[:page] + 1)
                       .per(params[:pageSize])

    pages = absences.total_pages

    absences = absences.map do |abs|
      {
        date: abs.activity_instance.time_interval.start.in_time_zone("Europe/Paris").strftime("%d/%m/%Y"),
        teacher: abs.activity_instance.activity.teacher.full_name,
        activity: abs.activity_instance.activity.activity_ref.label,
        type: abs.attended
      }
    end

    render json: {
      data: absences,
      pages: pages,
      total: total
    }
  end

  def family
    @current_user = current_user
    user = if params[:user_id]
              User.find(params[:user_id])
            else
              @current_user
            end
    authorize! :read, user

    season = Season.find_by(id: params[:season]) || Season.current_apps_season || Season.current

    whole_family = user.whole_family(season)

    attached_accounts = user.attached_accounts

    members = (whole_family + attached_accounts).uniq(&:id)

    respond_to do |format|
      format.json {
        render json: (members.map do |u|
          user_json = u.as_json(
            include: {
              planning: { include: [:time_intervals] },
              telephones: {},
              adhesions: {},
              activity_applications: {
                include: :desired_activities
              },
              addresses: {},
              instruments: {},
              consent_document_users: {},
              payer_payment_terms: {}
            },
            methods: %i[full_name]
          )

          user_json["family_links_with_user"] = u.family_links_with_user(season).as_json
          user_json["availabilities"] = u.availabilities(season).as_json
          user_json["avatar"] = u.avatar.attached? ? rails_blob_path(u.avatar, only_path: true) : nil

          user_json
        end)
      }
    end
  end

  def adherent_card
    @user = if params["id"].nil?
              current_user
            else
              User.find params["id"]
            end

    @current_user = @user unless @user.nil?

    qr_string = @user.adherent_number.to_s
    # qr_string = "d"
    @qr = RQRCode::QRCode.new(qr_string, size: 1, level: :h, mode: :numeric)
  end

  def hours_sheet
    @current_user = current_user
    @user = User.find(params[:id])
    @planning_id = @user.planning.id
    @min_year = (TimeInterval.minimum(:start) || Season.current.start).year
    @max_year = (TimeInterval.maximum(:end) || Season.current.end).year
  end

  # TODO/DECIDE ajuster les filtres sur les time intervals
  #      voir s'il faut un système de feuille d'heures incomplète/complète
  #      garder les feuilles en mémoire (même vides ?)
  def get_hours_sheet
    user = User.find(params[:id])

    year = params[:year]
    month = params[:month]

    # existing_sheet = user.hours_sheets.find_by(year: year, month: month)
    existing_sheet = nil

    if !existing_sheet.nil?
      # sends the stored json object to the requester
      render json: existing_sheet.json_sheet
    else
      # calculates the object associating hours
      # worked in each activity kind

      # get time_intervals of a month in a year
      # and groups them by day
      grouped_intervals = user
                            .planning
                            .time_intervals
                            .includes({
                                        activity_instance: {
                                          activity: :activity_ref
                                        }
                                      })
                            .where("date_trunc('month', time_intervals.start) = '#{year}-#{month}-01'::date AND time_intervals.kind IN ('c', 'p', 'o') AND time_intervals.is_validated")
                            .group_by { |ti| ti.start.to_date.to_s }

      # separates hours worked in the morning and the ones worked in the afternoon
      # result format :
      # [
      #   day-of-month: { (activity-kind => hours-worked-in-the-day-for-this-kind)* }
      # ]
      hours_sheet = grouped_intervals.transform_values do |arr|
        covered = { total: 0.0, counted: 0.0 }
        covering = 0.0
        # here's what the reduce does
        # [
        #   day-of-month: { (activity-kind => [time intervals of this activity kind in this day])* }
        # ]
        # and then we reduce all of the time intervals' durations into an aggregated one
        transformed = arr
                        .each_with_object({}) do |i, acc|
          key = i.activity_instance.activity.activity_ref.label
          duration = (i.end - i.start).to_f / 3600

          unless acc.has_key? key
            acc[key] = {
              total: 0,
              covered: 0,
              covering: 0
            }
          end

          cover_teacher_id = i.activity_instance.cover_teacher_id
          if cover_teacher_id
            if cover_teacher_id == user.id
              covering += duration
              acc[key][:covering] += duration
            else
              covered[:counted] += duration if i.activity_instance.are_hours_counted
              covered[:total] += duration
              acc[key][:covered] += duration
            end
          end

          acc[key][:total] += duration
        rescue StandardError
          print "ERROR: On Interval \##{i.id}"
        end

        {
          detail: transformed,
          covered: covered,
          covering: covering,
          total: transformed.values.map { |h| h[:total] }.sum
        }
      end

      # only store non empty hours sheets
      if hours_sheet.any?
        # user.hours_sheets.create!(year: year, month: month, json_sheet: hours_sheet)
      end

      render json: hours_sheet
    end
  end

  def new
    @errors = params[:errors] || []
    # Utilisation des erreurs via get = façon plus rapide de faire. => Mieux = appel de la creation via react & message dynamique
    @errors = nil if !@errors.is_a?(Array) || @errors.length.zero? || !@errors[0].is_a?(String)

    @users_to_attach = User.where(attached_to_id: nil)

    authorize! :manage, User
    @activity_refs = ActivityRef.all
  end

  def create
    user = User.new(user_params)

    # ne pas mettre dans "user_params" pour n'authorizer que cette fois l'attribut.
    user.attached_to_id = params[:user][:attached_to_id] if params[:user][:attached_to_id].present?
    user.last_name = user.last_name.strip
    user.first_name = user.first_name.strip
    user.email = nil if user.attached? && user.attached_to.email == user.email

    if user.teacher? && params[:user][:activity_refs]
      user.activity_refs = ActivityRef.find(params[:user][:activity_refs])
    end

    return redirect_to(new_user_path(errors: user.errors.full_messages)) unless user.errors.empty?

    # user.skip_confirmation_notification!
    begin
      user.save!
    rescue StandardError => e
      return redirect_to(new_user_path(errors: user.errors.full_messages))
    end

    redirect_to user
  end

  # destroy
  def destroy
    EventHandler.user.destroy_ended # call to create constant if not set

    params[:classname] = "User"
    params[:selected_dep_to_destroy] = [FamilyMemberUser.name,
                                        UserAddress.name,
                                        Adhesion.name,
                                        Planning.name,
                                        Student.name,
                                        Level.name,
                                        NewStudentLevelQuestionnaire.name,
                                        PreApplication.name]

    Rails.configuration.event_store.within do
      DestroyJob.perform_now(*params)
    end
         .subscribe(to: ["EventUserDestroyEnded".constantize]) do |event|
      args = event.data[:args]

      if args[:success]
        respond_to do |format|
          format.html do
            flash[:success] = args[:message]
            redirect_to users_path
          end
          format.json { render json: { message: args[:message], success: true }, status: :ok }
        end
      else
        respond_to do |format|
          format.html do
            flash[:destroy_error] = args[:message]
            redirect_to user_path(params[:id])
          end
          format.json { render json: { message: args[:message], success: false }, status: args[:status] }
        end
      end
    end
      .call
  end

  def edit
    user = User.includes({ telephones: {}, levels: {}, addresses: {} }).find(params[:id])
    authorize! :manage, user

    @userjson = user.as_json({
                               include: {
                                 telephones: {},
                                 addresses: { only: %i[id street_address country department postcode city] },
                                 levels: { include: %i[evaluation_level_ref activity_ref] },
                                 consent_document_users: {}
                               }
                             })

    @userjson["family_links_with_user"] = user.family_links_with_user(Season.current).as_json

    @addresses = user.addresses
    @school_name = School.first&.name
    @country_code = School.first&.address&.country || "FR"
    @levels = EvaluationLevelRef.all
    @current_user = current_user

    @lessons_planned = user.teacher_activity_instances.count if user.is_teacher

    # Règlement intérieur vue Edition
    @is_rules_specified = false

    @consent_docs = ConsentDocument.jsonize_consent_document_query(ConsentDocument.all.order(:index))

    method = Parameter.get_value("school.rules_of_procedure.method")
    if method == "PDF"
      blob = ActiveStorage::Blob.find_by(id: Parameter.get_value("school.rules_of_procedure.blob_id"))
      unless blob.nil?
        @document_url = rails_blob_url(blob, only_path: false)
        @is_rules_specified = true
      end
    elsif method == "URL"
      @document_url = Parameter.get_value("school.rules_of_procedure.url")
      @is_rules_specified = true
    end

    organizations = Organization.all
    @organizationOptions = []
    organizations.each do |o|
      @organizationOptions.push('label': o.name, 'value': o.id)
    end
  end

  def edit_activities
    user = User.includes(:activity_refs).find(params[:id])
    authorize! :edit, user
    @user = user
    @activity_refs = ActivityRef.all
  end

  def update
    @user = User.includes(:levels).find(params[:id])

    authorize! :edit, @user
    begin
      User.transaction do
        phones = []
        params[:user][:telephones]&.each do |p|
          phone = Telephone.new({ number: p[:number], label: p[:label] })
          phones << phone
        end
        @user.telephones = phones

        @season = Season.current_apps_season

        @user.update_addresses params[:user][:addresses] unless params[:user][:addresses].nil?

        @user.update_levels(params[:user][:levels])

        params[:user][:last_name] = params[:user][:last_name].strip
        params[:user][:first_name] = params[:user][:first_name].strip

        @user.is_paying = params[:user][:is_paying]

        @user.has_verified_infos = true

        up = user_params

        # par sécurité on force la valeur à false si l'utilisateur actuel n'est pas un admin && qu'il modifie sa page
        up[:is_admin] = false if !@user.is_admin && !current_user.is_admin && current_user.id == @user.id
        up[:identification_number] = nil if "#{up[:identification_number]}".empty?
        up[:email] = nil if @user.attached? && @user.attached_to.email == up[:email]

        payers = params.dig(:user, :payers)

        up[:is_paying] = payers&.include?(@user.id) || false

        @user.update!(up)

        @user.update_is_paying_of_family_links(payers, Season.current, false)

        params.dig(:user, :consent_docs)&.each do |doc|
          next if doc.nil? || (doc.class == Array && doc.length < 2)

          consentement = @user.consent_document_users.find_or_create_by(consent_document_id: "#{doc[0]}".gsub("id_", ""))

          consentement.has_consented = doc[1][:agreement]
          consentement.save!
        end
      end
    rescue ActiveRecord::RecordInvalid => invalid
      render json: invalid.to_json, status: 500
    else
      render json: @user, status: 200
    end
  end

  def createStudent
    student = User.new(user_params)

    student.first_name = student.first_name.strip
    student.last_name = student.last_name.strip
    student.is_teacher = false
    student.is_admin = false
    student.email = user_params[:email]

    begin
      student.save!
    rescue StandardError
      render json: { class: "User", errors: student.errors }, status: 500
      return
    end

    render json: { user: student.id }, status: 200
  end

  def update_family
    @user = User.includes(:levels).find(params[:id])
    @season = Season.current
    is_created = FamilyMemberUsers.addFamilyMemberWithConfirmation(
      params[:user][:family],
      @user,
      @season,
      send_confirmation: true
    )

    render status: :created, json: is_created
  end

  def update_activities
    user = User.find(params[:id])

    authorize! :update, user
    user.activity_refs = ActivityRef.find(params[:activities])
    user.save

    redirect_to user
  end

  def season_activities
    @current_user = current_user
    @user = User.find(params[:id])
    season = Season.next
    @season = season.as_json(methods: :previous)
    @questions = Question.student_evaluation_questions.all

    @evaluation_level_refs = EvaluationLevelRef.all
    @activity_refs = ActivityRef.all
    @seasons = Season.all
    @rooms = Room.all
    @locations = Location.all
    @teachers = User.teachers.all
    @payment_methods = PaymentMethod.all
    temp_act = @user
                 .season_teacher_activities(Season.current)
                 .includes({
                             time_interval: {},
                             activity_ref: { activity_ref_kind: {} },
                             student_evaluations: %i[answers student],
                             users: {
                               levels: {
                                 evaluation_level_ref: {},
                                 activity_ref: { activity_ref_kind: {} }
                               }
                             }
                           })
    @activities = temp_act.where({ activity_ref: { activity_type: nil } })
                          .or(temp_act.where.not({ activity_ref: { activity_type: %w[child cham] } }))
                          .order(Arel.sql("extract(isodow from time_intervals.start)::text || time_intervals.start::time::text asc"))
    # order regardless of date in year, just day of week and time

    @activities_json = @activities.as_json(include: {
      time_interval: {},
      activity_ref: { include: :activity_ref_kind },
      student_evaluations: {
        include: %i[answers student]
      },
      users: {
        include: {
          levels: {
            include: {
              evaluation_level_ref: {},
              activity_ref: { include: :activity_ref_kind }
            }
          }
        }
      }
    })

    @activities = @activities.as_json(include: :users)
  end

  def evaluate
    @current_user = current_user
    @user = User.find(params[:id])
    @activity_ref = Activity.joins(activity_ref: { activity_ref_kind: {} }).includes(activity_ref: { activity_ref_kind: {} }).find(params[:activity_id])
    season = Season.from_interval(@activity_ref.time_interval).first
    @season = season.next.as_json(methods: :previous) # les évaluations des étudiants sont associés à la saison n+1 si l'activity était en saison n

    activities = @user.season_teacher_activities(season)
    @activities = activities.as_json(include: { users: {}, activity_ref: { activity_ref_kind: {} } })
    @questions = Question.student_evaluation_questions.all

    @evaluation_level_refs = EvaluationLevelRef.all
    @activity_refs = ActivityRef.includes(:activity_ref_kind).all
    @seasons = Season.all
    @rooms = Room.all,
      @locations = Location.all
    @teachers = User.teachers.all
    @payment_methods = PaymentMethod.all

    @evaluations_json = StudentEvaluation.where(
      teacher: @user,
      activity: @activity_ref,
      season: @season["id"]
    ).as_json(include: :answers)

    @activity_json = @activity_ref.as_json({
                                             include: {
                                               users: {
                                                 include: {
                                                   levels: {
                                                     include: {
                                                       evaluation_level_ref: {},
                                                       activity_ref: { include: { activity_ref_kind: {} } }
                                                     }
                                                   }
                                                 }
                                               },
                                               activity_ref: { include: { activity_ref_kind: {} } }
                                             }
                                           })
  end

  def previsional_groups
    @current_user = current_user

    groups_question = Question.student_evaluation_questions.find_by_name("groups_he_could_be_in_next_season")
    groups_select_values = groups_question.select_values.split(";").map { |v| v.split(":") }

    pursue_question = Question.student_evaluation_questions.find_by_name("pursue_on_next_season")
    group_change_question = Question.student_evaluation_questions.find_by_name("should_change_activity")
    informed_question = Question.student_evaluation_questions.find_by_name("informed_in_due_time_of_change")

    @season = Season.next
    @teacher = User.teachers.find(params[:id])

    @activities_students = {}

    evaluations = StudentEvaluation.where(teacher: @teacher, season: @season)

    @pursue_answers = evaluations.each_with_object({}) do |e, h|
      # I don't know
      pursue_answer = e
                        .answers
                        .where(question: pursue_question)
                        .first
                        .value

      h[e.activity_id] ||= { yes: [], no: [], maybe: [] }
      h[e.activity_id][:yes] << e.student.id if pursue_answer == "true"
      h[e.activity_id][:no] << e.student.id if pursue_answer == "false"
      h[e.activity_id][:maybe] << e.student.id if pursue_answer == "null"
    end

    @changes = evaluations.each_with_object({}) do |e, h|
      group_change_answer = e.answers.where(question: group_change_question).first.value

      next unless group_change_answer != "no"

      groups_answer = e.answers.where(question: groups_question).first.value.split(",")

      suggested_groups = nil
      groups_answer.each do |a|
        next unless a.start_with?("static_")

        groups_select_values.each do |v|
          suggested_groups = v[0] if v[1] == a
        end
      end

      informed_answer = e.answers.where(question: informed_question).first.value
      h[e.activity_id] ||= {}
      h[e.activity_id][e.student.id] = { informed: informed_answer == "true", groups: suggested_groups }
    end

    activities_ids = evaluations.map do |e|
      ids = e
              .answers
              .where(question: groups_question)
              .map { |a| a.value.split(",") }
              .flatten
              .select { |v| !v.start_with?("static_") }
              .map(&:to_i)

      ids = [e.activity_id] if ids.none?

      ids.each do |id|
        (@activities_students[id] || (@activities_students[id] = {}))[e.student_id] = e.id
      end
    end.flatten

    @students = evaluations.map(&:student).uniq.as_json({
                                                          include: {
                                                            levels: {
                                                              include: [:evaluation_level_ref]
                                                            }
                                                          }
                                                        })

    @questions = Question.student_evaluation_questions
    @evaluation_level_refs = EvaluationLevelRef.all

    @activities = Activity
                    .includes({
                                time_interval: {},
                                activity_ref: {}
                              })
                    .where(id: activities_ids)
                    .as_json({
                               include: {
                                 activity_ref: {},
                                 time_interval: {}
                               }
                             })

    authorize! :manage, @activities unless @current_user.is_teacher
  end

def search_for_user
  includes = {
    include: {
      telephones: {},
      addresses: { only: %i[id street_address country department postcode city] },
      planning: { include: [:time_intervals] },
      levels: { include: %i[evaluation_level_ref activity_ref] },
      consent_document_users: {},
    },
    methods: [:family_links_with_user, :avatar_url]
  }

  season = params[:season_id].present? ? Season.find(params[:season_id]) : Season.current_apps_season

  birthday = params[:birthday]

  result = Users::SearchUser.new(params[:last_name] || "", params[:first_name] || "", birthday, nil, nil, includes,
                                 !current_user.is_admin).execute

  result.each do |u|
    if can? :read, u
      u["family_member_users"] = u["family_links_with_user"].select { |fmu| fmu["season_id"] == season.id }
    end
  end

  render json: result
end

  def search_for_admin
  return render json: {}, status: 403 if current_user.simple?

  includes = {
    include: {
      planning: { include: [:time_intervals] },
      telephones: {},
      adhesions: {},
      activity_applications: {
        include: :desired_activities
      },
      addresses: {},
      instruments: {},
      consent_document_users: {},
      payer_payment_terms: {}
    },
    methods: [:family_links_with_user, :avatar_url]
  }

  result = Users::SearchUser.new(params[:last_name], params[:first_name], nil, params[:season_id], nil, includes,
                                 false, params[:hideAttachedAccounts]).execute

  render json: result
end

  def set_level
    user = User.find(params[:id])
    level = user.levels.find_or_create_by!(season_id: params[:season_id], activity_ref_id: params[:activity_ref_id])
    level.update(evaluation_level_ref_id: params[:evaluation_level_ref_id])

    render json: level
  end

  def delete_level
    user = User.find(params[:id])
    level = user.levels.find_by(season_id: params[:season_id], activity_ref_id: params[:activity_ref_id])
    level.destroy!

    render json: level
  end

  def get_family_links_with_user
    user = User.find(params[:id])
    season = Season.find(params[:season_id])

    render json: user.family_links_with_user(season)
  end

  def upload_csv
    @current_user = current_user
    import_params = params.permit(:csv_file)

    return if import_params[:csv_file].nil?

    import_report = Users::CsvImportHandler.new.import_users(import_params[:csv_file])
    render json: { import_report: import_report }
    nil
  end

  def change_address
    user = User.find(params[:id])
    address = Address.find(params[:new_address])

    user.update(address: address) if !user.nil? && !address.nil?
  end

  def unlink_address
    toUpdate = User.find(params[:id])
    toUpdate&.update(address: nil)
  end

  def upload_avatar
    user = User.find(params[:id])
    user.avatar.attach(params[:avatar])
    user.save!
  end

  def presence_sheet
    @current_user = current_user

    @user = User.find(params[:id])

    date = Date.today

    date = Date.parse(params[:date]) unless params[:date].nil?

    @date = date
    @next_date = date + 1.days
    @prev_date = date - 1.days
    @next_week = date + 1.week
    @prev_week = date - 1.week

    @instances = @user
                   .planning
                   .time_intervals
                   .includes(:activity_instance)
                   .where("start::date = ?", @date)
                   .collect(&:activity_instance)
                   .compact
                   .as_json(include: {
                     activity: {
                       include: {
                         activity_ref: {},
                         users: {},
                         options: {
                           include: :user
                         }
                       }
                     },
                     student_attendances: {
                       include: :user
                     },
                     time_interval: {},
                     room: {
                       only: :label
                     }
                   })
  end

  # (pour élèves/admin) page de gestion des inscriptions, affiche les inscriptions actuelles, les réinscription et les demandes d'inscription
  def new_application
    @hide_navigation = false
    # @type [User]
    user = User.includes(pre_applications: :pre_application_activities).find(params[:id])

    @season = Season.current_apps_season || Season.current

    # redirect_to "/401" and return if !@season || DateTime.now < @season.opening_date_for_applications
    pre_application_id = user.pre_applications.where(season: @season).pick(:id)

    unless pre_application_id
      pre_application_id = user.pre_applications.create!(
        user: user,
        season: @season
      ).id

      statuses = ActivityApplicationStatus.where(is_stopping: false).pluck(:id)
      activity_ids = Activity
                       .joins([
                                :activity_ref,
                                { desired_activities: :activity_application }
                              ])
                       .includes([
                                   :activity_ref,
                                   { desired_activities: :activity_application }
                                 ])
                       .where({
                                activity_application: {
                                  activity_application_status_id: statuses,
                                  season_id: @season.previous.id,
                                  user_id: user.id
                                }
                              })
                       .where({
                                activity_ref: {
                                  activity_type: ActivityRef.activity_types
                                                            .except(:cham)
                                                            .keys
                                                            .append(nil)
                                }
                              })
                       .pluck(:id)

      activity_ids.each do |activity_id|
        PreApplicationActivity.create!(
          activity_id: activity_id,
          pre_application_id: pre_application_id
        )
      end

      # comment for now, we don't want to copy the availabilities to use default school availabilities
      # TimeIntervals::CopyAvailabilities.new(user.planning_id, @season.previous, @season, ["p"]).execute
    end

    #  We need to update the desired_activities if they change
    # (the activities don't change, they are from the previous season)
    # desired_activities = [] << user.pre_application.desired_activities.to_a

    # # We only take desired activities which are not assigned, no activity, because otherwise,
    ## they are in the activities above, and this would create duplicates
    # desired_activities << user.get_desired_activities.select {|da| da.activity.nil?}
    # desired_activities.flatten!.uniq!

    # user.pre_application.desired_activities = desired_activities
    # user.pre_application.save

    authorize! :manage, user
    # @type [User]
    @current_user = current_user

    jsonize_pre_application = lambda { |pre_app_id|
      PreApplication.find(pre_app_id).as_json(include: {
        pre_application_desired_activities: {
          include: {
            activity_application: {
              include: [:activity_application_status]
            },
            desired_activity: {
              include: {
                activity_ref: {
                  methods: %i[is_default_in_kind?]
                }
              }
            }
          }
        },
        pre_application_activities: {
          include: {
            activity_application: {
              include: {
                activity_application_status: {},
                desired_activities: {
                  include: {
                    activity_ref: {
                      include: {
                        next_cycles: {
                          include: {
                            to: {
                              methods: %i[is_default_in_kind?]
                            }
                          }
                        }
                      },
                      methods: %i[is_default_in_kind?]
                    }
                  }
                }
              }
            },
            activity: {
              include: {
                activity_ref: {
                  include: {
                    next_cycles: {
                      include: {
                        to: {
                          methods: %i[is_default_in_kind?]
                        }
                      }
                    }
                  },
                  methods: %i[is_default_in_kind?]
                },
                teacher: {},
                room: {},
                time_interval: {}
              }
            }
          }
        },
        user: { methods: %i[full_name] }
      })
    }

    # pour un admin connecté, l'utilisateur de référence (point d'entrée) est le user qui est passé en paramètre
    # lorsque l'utilisateur connecté n'est pas admin, l'utilisateur de référence est lui-même
    reference_user = @current_user.is_admin? ? user : current_user
    family_users =
      reference_user
        .get_users_self_is_paying_for(@season)
        .select do |u|
        # on ne garde que les élèves qui ont une inscription validée au cours de la saison précédente
        # 12/06/2023 retrait du filtre pour les nouvelles inscriptions car l'enfant ou la mère (otherActivityItem) n'était pas remonté
        u.id != user.id #&&
        # ActivityApplication.where(
        #   user_id: u.id,
        #   season: @season.previous.id,
        #   activity_application_status_id: [ActivityApplicationStatus::ACTIVITY_ATTRIBUTED_ID,
        #                                    ActivityApplicationStatus::PROPOSAL_ACCEPTED_ID]
        # ).any?
      end

    family_users ||= []
    users_paying_for = user.get_users_paying_for_self.reject { |u| u.id == user.id }
    if @current_user.is_admin
      family_users += users_paying_for
    elsif users_paying_for&.include?(current_user)
      family_users << current_user
    end

    family_users += user.attached_accounts
    family_users += [user.attached_to] if user.attached_to&.id == @current_user.id || (user.attached_to && @current_user.is_admin)

    @pre_application = jsonize_pre_application.call(pre_application_id)

    @family_users = []
    family_users.uniq.each do |u|
      user_json = User.find(u.id).as_json(methods: :full_name)
      pre_app = u.pre_applications
                 .includes(:pre_application_activities, :user)
                 .where(season_id: @season.id)
                 .first
      user_json["pre_application"] = jsonize_pre_application.call(pre_app.id) if pre_app
      user_json["avatar"] = u.avatar_url
      @family_users << user_json
    end

    @user = user
    # if @pre_application['pre_application_activities'][0]['activity_application']
    #   @next_activity = Activity.find(@pre_application['pre_application_activities'][0]['activity_application']['desired_activities'][0]['activity_id'])
    #                            .as_json(include: {
    #                                       teacher: {},
    #                                       room: {},
    #                                       time_interval: {},
    #                                     })
    # end

    @pre_application["pre_application_activities"]&.each do |pa|
      if pa["activity_application"]
        pa["activity_application"]["desired_activities"].each do |da|
          next if da["activity_id"].nil?

          pa["next_activity"] = Activity.find(da["activity_id"]).as_json(include: {
            teacher: {},
            room: {},
            time_interval: {}
          })
        end
      end
    end

    @current_activity_applications = user.activity_applications.where(season_id: @season.previous).as_json(include: { activity_application_status: {},
                                                                                                                      desired_activities: {
                                                                                                                        include: {
                                                                                                                          activity_ref: {
                                                                                                                            include: {
                                                                                                                              next_cycles: {
                                                                                                                                include: {
                                                                                                                                  to: {
                                                                                                                                    methods: %i[is_default_in_kind?]
                                                                                                                                  }
                                                                                                                                }
                                                                                                                              }
                                                                                                                            },
                                                                                                                            methods: %i[is_default_in_kind?]
                                                                                                                          },
                                                                                                                          activity: {
                                                                                                                            include: {
                                                                                                                              activity_ref: {
                                                                                                                                methods: %i[is_default_in_kind?]
                                                                                                                              },
                                                                                                                              teacher: {},
                                                                                                                              room: {},
                                                                                                                              time_interval: {}
                                                                                                                            }
                                                                                                                          }
                                                                                                                        }
                                                                                                                      }
    })

    @pre_application_activities = user.pre_applications.find_by(season_id: @season).pre_application_activities

    @current_activity_applications.each do |activity_application|
      @pre_application_activities.each do |pre_application_activity|
        # Il n'y qu'une seule desiredActivity par ActivityApplication
        if activity_application.dig("desired_activities", 0, "activity", "id") == pre_application_activity[:activity_id]
          activity_application["pre_application_activity"] = pre_application_activity
        end
      end
    end

    @user_activities_applications = user.activity_applications.where(season_id: @season).as_json(include: { activity_application_status: {},
                                                                                                            desired_activities: {
                                                                                                              include: {
                                                                                                                activity_ref: {
                                                                                                                  methods: %i[is_default_in_kind?]
                                                                                                                },
                                                                                                                activity: {
                                                                                                                  include: {
                                                                                                                    activity_ref: {
                                                                                                                      methods: %i[is_default_in_kind?]
                                                                                                                    },
                                                                                                                    teacher: {},
                                                                                                                    room: {},
                                                                                                                    time_interval: {}
                                                                                                                  }
                                                                                                                }
                                                                                                              }
                                                                                                            }
    })

    @pre_applications_renew_ids = user.pre_applications.where(season_id: @season).map { |pa| pa.pre_application_activities }
                                      .flatten
                                      .map { |paa| paa.activity_application_id }
                                      .compact

    set_status = Parameter.find_by(label: "activityApplication.default_status")

    @default_activity_status_id = set_status&.parse&.positive? ? set_status.parse : ActivityApplicationStatus::TREATMENT_PENDING_ID
    @new_activities_applications = @user_activities_applications.reject { |activity| @pre_applications_renew_ids.include?(activity["id"]) }
    @previous_season = @season.previous
    @confirm_activity_text = Parameter.find_by(label: "confirm_activity_text")
  end

  def exist
    exist = false
    bday = Date.strptime(params[:birthday], "%Y-%m-%d")
    email = User.where(
      birthday: bday
    ).ci_find(:first_name, params[:first_name]).ci_find(:last_name, params[:last_name]).first&.email
    pp email
    render json: { email: email }
  end

  def resend_confirmation
    ids = params[:ids]

    ids = User.all.where(encrypted_password: nil, attached_to_id: nil).pluck(:id) if ids.blank?

    user_sended = []
    ids.each do |id|
      user = User.find(id)

      next unless user.has_no_password?

      DeviseMailer.confirmation_instructions(user, user.confirmation_token).deliver_later
      user_sended << user.full_name
    end

    render json: user_sended, status: :ok
  end

  def reset_password
    user = User.find(params[:user_id])
    return render json: {}, status: :unauthorized if !current_user.is_admin || user.id == current_user.id

    token = user.set_reset_password_token
    reset_link = edit_user_password_url(reset_password_token: token)

    if params[:send_email] == "true"
      Devise::Mailer.reset_password_instructions(user, token).deliver_later
      render json: { message: "Email envoyé" }, status: :ok
    else
      render json: {
        reset_link: reset_link,
        is_admin: user.is_admin,
        is_teacher: user.is_teacher
      }, status: :ok
    end
  end



  def all_doc_consented
    # @type [User]
    @user = User.find(params[:id])

    render json: { all_doc_consented: @user.consent_document_users }
  end

  def attach_users
    user = User.find(params[:id])

    render json: {message: "compte de rattachement introuvable"}, status: :not_found and return if user.nil?

    ActiveRecord::Base.transaction do
      (params[:users] || []).each do |u|
        user_to_attach = User.find(u[:id])
        next if user_to_attach.nil? || user_to_attach.attached? || user_to_attach.id == user.id

        user_to_attach.attached_to = user
        user_to_attach.email = u[:email]
        user_to_attach.save!
      end
    end

  rescue ActiveRecord::RecordInvalid => invalid
    render json: {message: invalid.message}, status: :unprocessable_entity
  end

  def detach_user
    user_to_detach = User.find(params[:id])

    render json: {message: "user not found"}, status: :not_found and return if user_to_detach.nil?

    old_main_user = user_to_detach.attached_to

    user_to_detach.attached_to = nil
    user_to_detach.email = params[:email]

    if user_to_detach.save

      DeviseMailer.confirmation_instructions(user_to_detach, user_to_detach.confirmation_token).deliver_later

      if params[:from] == "family_link"
        unless params[:addFamilyLink]
          family_links = user_to_detach.family_links

          links_to_deletes = family_links.select { |fl| fl.user_id == old_main_user.id || fl.member_id == old_main_user.id }

          FamilyMemberUser.where(id: links_to_deletes.map(&:id)).delete_all
        end
      else
        if params[:addFamilyLink]
          is_created = FamilyMemberUsers.addFamilyMemberWithConfirmation(
            [ActiveSupport::HashWithIndifferentAccess.new(old_main_user.as_json.merge({link: params[:link], is_paying_for: params[:is_paying_for], is_legal_referent: params[:is_legal_referent]}))],
            user_to_detach,
            Season.current,
            send_confirmation: true
          )

          unless is_created
            render json: { message: "Le lien familial n'as pus être créer mais l'utilisateur à bien été détaché" }, status: :unprocessable_entity
            return
          end
        end
      end

      render json: {message: "success"}, status: :ok
    else
      render json: {message: user_to_detach.errors.full_messages}, status: :unprocessable_entity
    end
  end

  private

  def users_list_json(query, params)
    sort_order = params[:sorted][:desc] ? :desc : :asc

    total = query.count

    query = query.order(params[:sorted][:id].to_sym => sort_order)
                 .page(params[:page] + 1)
                 .per(params[:pageSize])

    pages = query.total_pages

    @users = query.as_json({
                             include: %i[planning adhesions activities],
                             methods: [:any_users_self_is_paying_for?]
                           })
    authorize! :read, @users

    {
      users: @users,
      pages: pages,
      total: total
    }
  end

  def users_list_csv(query)
    CSV.generate nil, col_sep: ";" do |csv|
      csv << [
        "N° adhérent",
        "Nom",
        "Prénom",
        "Email",
        "N° de téléphone",
        "Date de naissance"
      ]

      query
        .includes(:telephones)
        .each do |u|
        telephone = u.telephones.select { |t| t.label == "portable" }.first || u.telephones.first

        telephone_number = telephone&.number || "?"

        csv << [
          u.adherent_number,
          u.last_name,
          u.first_name,
          u.email,
          telephone_number,
          u.birthday && u.birthday.strftime("%d/%m/%Y") || "?"
        ]
      end
    end
  end

  def user_params
    params.require(:user).permit(
      :birthday,
      :created_at,
      :email,
      :first_name,
      :handicap,
      :handicap_description,
      :id,
      :is_admin,
      :is_teacher,
      :is_paying,
      :last_name,
      :password,
      :password_confirmation,
      :self_level,
      :sex,
      :solfege,
      :updated_at,
      :activity_refs,
      :evaluation_level_ref_id,
      :checked_gdpr,
      :checked_image_right,
      :checked_newsletter,
      :organization_id,
      :identification_number,
    )
  end

  def wrap_in_sign_in_token
    redirect_to u_sign_in_with_token_path(request.parameters) if params[:auth_token]
  end
end
