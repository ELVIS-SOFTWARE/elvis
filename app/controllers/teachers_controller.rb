class TeachersController < ApplicationController
  def index

    t_params = params.permit(
      :activityId,
    )

    activityId = t_params[:activityId]

    @current_user = current_user
    @teachers = User.where(is_teacher: true).order(last_name: :asc)

    authorize! :manage, @current_user.is_admin

    if !activityId.nil?
      @teachers = @teachers.includes({
                                       teachers_activity_refs: :activity_ref
                                     }).where({
                                                teachers_activity_refs: {
                                                  activity_refs: {
                                                    id: activityId
                                                  }
                                                }
                                              }

      )
    end

    respond_to do |format|
      format.html

      format.json do
        render json: @teachers.as_json(
          except: [:created_at, :updated_at, :deleted_at,
                   :authentication_token, :authentication_token_created_at, :first_connection, :is_creator])
      end
    end
  end

  def list_activities
    begin
      teacher = User.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render status: :not_found, json: { error: "no such user" } and return
    end

    if params[:from_date]
      begin
        from_date = params[:from_date].to_date
      rescue Date::Error
        render status: :not_found, json: { error: "invalid date" } and return
      end
    else
      from_date = Date.today
    end

    activity_ids = teacher.teacher_activity_instances(from_date)
                          .order("start")
                          .pluck("activity_id")
                          .uniq

    activities = Activity
                   .where(id: activity_ids)
                   .as_json(
                     include: [:time_interval, :room, :activity_ref]
                   )

    render status: :ok, json: activities
  end

  # Supprime la liste des séances à venir pour ce prof
  def delete_upcoming_activity_instances
    begin
      teacher = User.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render status: :not_found, json: { error: "no such user" } and return
    end

    from_date = Date.today

    activity_instance_ids = teacher.teacher_activity_instances(from_date)
                                   .pluck(:id)

    ActivityInstance
      .where(id: activity_instance_ids)
      .destroy_all

    render status: :ok, json:{}
  end

  # Renvoie la liste des professeurs avec leur disponibilité sur le créneau spécifié
  # **Paramètres**
  # - start : le début du créneau sur lequel vérifier les disponibilités
  # - end : la fin du créneau sur lequel vérifier les disponibilités
  # - recurrence (optionnel) : 1 pour vérifier la disponibilité toutes les semaines ; 0 ou absent si on ne veut vérifier les disponibilités que sur le créneau spécifié 
  # - from_date (optionnel) : date de début pour la récurrence ; absent si on ne veut vérifier les disponibilités que sur le créneau spécifié 
  # - to_date (optionnel) : date de fin pour la récurrence ; absent si on ne veut vérifier les disponibilités que sur le créneau spécifié 
  # **Retourne**
  # - un JSON avec les objets User correspondant aux profs et enrichi avec une propriété "has_overlap"
  # - la propriété "has_overlap" vaut false si le prof est disponible ; sinon, elle contient le 1er créneau où le prof n'est pas disponible
  # def index_with_overlap
  #   @current_user = current_user
  #   authorize! :manage, @current_user.is_admin

  #   ti_params = params.permit( 
  #     :startTime, 
  #     :endTime,
  #     :recurrence,
  #     :fromDate,
  #     :toDate
  #   )

  #   interval = TimeInterval.new({start: ti_params[:startTime], end: ti_params[:endTime]})
  #   if(interval.start.nil? || interval.end.nil?)
  #     render json: { errors: "invalid start or end" }, status: 500
  #     return
  #   end

  #   # date_and_time = '%d-%m-%Y %H:%M:%S %Z'
  #   ti_params[:startTime] = DateTime.parse(ti_params[:startTime])
  #   ti_params[:endTime] = DateTime.parse(ti_params[:endTime])

  #   season = Season.from_interval(interval).first

  #   recurrence = 0
  #   if ti_params[:recurrence]
  #     recurrence = ti_params[:recurrence].to_i
  #     from_date = ti_params[:fromDate]&.to_date
  #     to_date = ti_params[:toDate]&.to_date
  #   end

  #   # on récupère la liste des profs
  #   @teachers = User.where(is_teacher: true).order(last_name: :asc)
  #   teachers_json = @teachers.as_json(
  #     except: [:created_at, :updated_at, :deleted_at, 
  #       :authentication_token, :authentication_token_created_at, :first_connection, :is_creator] )

  #   # et on l'enrichit avec les conflits éventuels
  #   i = 0
  #   @teachers.each do |teacher|

  #     ## vérification des conflits
  #     # si c'est une vérification d'un créneau unique      
  #     if(recurrence==0)
  #       overlap = interval.overlap_teacher(teacher.id)

  #     # si c'est une vérification de tous les créneaux au cours de la saison
  #     else

  #       from_date = Time.zone.at(from_date.to_time.to_i)  
  #       to_date = Time.zone.at(to_date.to_time.to_i)  

  #       # on sécurise le from et le to
  #       from_date, to_date = interval.check_and_adjust_range(from_date, to_date).values

  #       # et on récupère, le cas échéant, le 1er intervalle en conflit
  #       overlap = interval.overlap_teacher_over_weeks(teacher.id, ti_params[:startTime], to_date).as_json(
  #                 except: [:created_at, :updated_at, :deleted_at])
  #     end

  #     teachers_json[i][:has_overlap] = !overlap.nil?

  #     ## vérification des disponibilités
  #     # 
  #     teachers_json[i][:availabilities] = teacher.planning.time_intervals.available.for_season(season)

  #     i = i+1
  #   end

  #   respond_to do |format|

  #     format.json do
  #         render json: teachers_json
  #         return
  #     end
  #   end
  # end

  # Renvoie le professeur avec ses disponibilités et conflits sur le créneau spécifié
  # **Paramètres**
  # - id : l'identifiant du user teacher
  # - start : le début du créneau sur lequel vérifier les disponibilités
  # - end : la fin du créneau sur lequel vérifier les disponibilités
  # - recurrence (optionnel) : 1 pour vérifier la disponibilité toutes les semaines ; 0 ou absent si on ne veut vérifier les disponibilités que sur le créneau spécifié 
  # - from_date (optionnel) : date de début pour la récurrence ; absent si on ne veut vérifier les disponibilités que sur le créneau spécifié 
  # - to_date (optionnel) : date de fin pour la récurrence ; absent si on ne veut vérifier les disponibilités que sur le créneau spécifié 
  # **Retourne**
  # - un JSON avec les objets User correspondant aux profs et enrichi avec une propriété "has_overlap"
  # - la propriété "has_overlap" vaut false si le prof est disponible ; sinon, elle contient le 1er créneau où le prof n'est pas disponible

  def show_with_overlap
    @current_user = current_user
    authorize! :manage, @current_user.is_admin

    t_params = params.permit(
      :id,
      :startTime,
      :endTime,
      :recurrence,
      :fromDate,
      :toDate
    )

    interval = TimeInterval.new({ start: t_params[:startTime], end: t_params[:endTime] })
    if (interval.start.nil? || interval.end.nil?)
      render json: { errors: "invalid start or end" }, status: 500
      return
    end

    # date_and_time = '%d-%m-%Y %H:%M:%S %Z'
    t_params[:startTime] = DateTime.parse(t_params[:startTime])
    t_params[:endTime] = DateTime.parse(t_params[:endTime])

    season = Season.from_interval(interval).first

    recurrence = 0
    if t_params[:recurrence]
      recurrence = t_params[:recurrence].to_i
      from_date = t_params[:fromDate]&.to_date
      to_date = t_params[:toDate]&.to_date
    end

    # on récupère le prof
    id = t_params[:id]
    @teacher = User.where(id: id, is_teacher: true).first

    unless @teacher
      render status: 400, json: { error: "unknown teacher" } and return
    end

    teacher_json = @teacher.as_json(
      except: [:created_at, :updated_at, :deleted_at,
               :authentication_token, :authentication_token_created_at, :first_connection, :is_creator])

    # puis on l'enrichit avec les conflits éventuels

    ## vérification des conflits
    # si c'est une vérification d'un créneau unique      
    if (recurrence == 0)
      overlap = interval.overlap_teacher(id)

      # si c'est une vérification de tous les créneaux au cours de la saison
    else

      from_date = Time.zone.at(from_date.to_time.to_i)
      to_date = Time.zone.at(to_date.to_time.to_i)

      # on sécurise le from et le to
      from_date, to_date = interval.check_and_adjust_range(from_date, to_date).values

      # et on récupère, le cas échéant, le 1er intervalle en conflit
      overlap = interval.overlap_teacher_over_weeks(id, t_params[:startTime], to_date).as_json(
        except: [:created_at, :updated_at, :deleted_at])
    end

    teacher_json[:has_overlap] = !overlap.nil?

    if teacher_json[:has_overlap]
      activityInstanceOverlapped = ActivityInstance.find_by(time_interval_id: overlap['id']).as_json()
      room_id = activityInstanceOverlapped['room_id']
      activity_id = activityInstanceOverlapped['activity_id']
      activity_ref_id = Activity.find(activity_id)&.activity_ref_id

      teacher_json[:activity_overlapped] = {
        room: Room.find_by(id: room_id).as_json['label'],
        activity_ref: ActivityRef.find_by(id: activity_ref_id).as_json['label'],
        start: (overlap['start'].to_datetime.strftime("%Ih%M")),
        end: overlap['end'].to_datetime.strftime("%Ih%M"),
      }
      # activityRefOverlapped = ActivityRef.find(activityOverlapped.activity_ref_id)
    end

    ## vérification des disponibilités
    # 
    teacher_json[:availabilities] = @teacher.planning.time_intervals.available.for_season(season)

    respond_to do |format|

      format.json do
        render json: teacher_json
        return
      end
    end
  end

end
