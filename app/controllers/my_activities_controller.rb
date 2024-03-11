# frozen_string_literal: true

class MyActivitiesController < ApplicationController
  before_action -> { @current_user = current_user }
  before_action :authorize_user, only: [:show, :show_bookings_and_availabilities, :show_upcoming_activities]

  def authorize_user
    if current_user.id != params[:id].to_i && !current_user.admin?
      redirect_to main_app.root_url
    end
  end

  ##########
  #  SHOW  #
  ##########

  ###### Page Principale ######
  def show
    respond_to do |format|
      format.html

      format.json {
        render json: {
          seasons: Season.all,
          current_season: Season.current,
        }
      }
    end
  end

  ###### Page Réservations ######
  def show_bookings_and_availabilities

  end

  ###### Page des prochains cours ######
  def show_upcoming_activities

  end

  ########################
  #  API CALLS FOR DATA  #
  ########################

  ###### Page Réservations ######
  def get_bookings_and_availabilities
    availabilities = []
    my_activities = []

    pack = Pack.find(params[:pack_id])
    activity_ref_pricing = pack.activity_ref_pricing
    activity_ref = activity_ref_pricing.activity_ref

    activities = Activity.where(activity_ref_id: activity_ref.id)

    # Les disponibilités sont des activités qui ne sont pas réservées par l'utilisateur
    # Mes activités sont des activités réservées par l'utilisateur
    activities.each do |activity|
      activity.activity_instances.each do |instance|
        next if instance.nil?
        availabilities.push(instance) if DateTime.now < instance.time_interval.start

        # on vérifie si l'activité a été réservée par l'utilisateur
        instance.student_attendances.each do |attendance|
          if attendance.user_id == params[:user_id].to_i
            if instance.time_interval.start
              my_activities.push(instance) # c'est une activité réservée par l'utilisateur
            end
          end
        end
      end
    end

    # On retire les activités réservées par l'utilisateur des disponibilités
    availabilities = availabilities - my_activities

    # On trie les activités par date de début
    availabilities = availabilities.sort_by do |activity|
      activity.time_interval.start
    end

    my_activities = my_activities.sort_by do |activity|
      activity.time_interval.start
    end

    respond_to do |format|
      format.json {
        render json: {
          user: User.find(params[:user_id]),
          availabilities: availabilities.as_json({
                                                   include: {
                                                     teacher: {},
                                                     room: {},
                                                     time_interval: {}
                                                   }
                                                 }),
          my_activities: my_activities.as_json({
                                                 include: {
                                                   teacher: {},
                                                   room: {},
                                                   time_interval: {}
                                                 }
                                               }),
          activity_ref: activity_ref.as_json({ only: [:id, :label, :kind, :occupation_limit] }),
          activity_ref_pricing: activity_ref_pricing.as_json,
          pack: pack.as_json,
          hours_before_cancelling: Parameter.get_value("planning.hours_before_cancelling_activity") || 0,
          nb_students: Pack.select(:user_id).distinct.count,
        }
      }
    end
  end

  ###### Page Principale ######
  def get_own_and_possible_user_activities
    user_packs = !params[:id].nil? ?
                   Pack.where(user_id: params[:user_id])
                   :
                   Pack.where(user_id: params[:user_id], season_id: params[:season_id])
    user = User.find(params[:user_id])

    respond_to do |format|
      format.json {
        render json: {
          regular_user_activities: user.activity_applications.where(season_id: params[:season_id]).as_json(
            include: { activity_application_status: {},
                       desired_activities: {
                         include: {
                           activity_ref: {},
                           activity: {
                             include: {
                               activity_ref: {},
                               teacher: {},
                               room: {},
                               time_interval: {}
                             }
                           }
                         }
                       }
            }),

          userActivities: user_packs.as_json({
                                               include: {
                                                 activity_ref: {
                                                   methods: [:picture_path],
                                                   include: {
                                                     activities: {
                                                       include: {
                                                         teacher: {},
                                                         room: {},
                                                         time_interval: {}
                                                       }
                                                     },
                                                   },
                                                   season: {},
                                                   pricing: {},
                                                 }
                                               }
                                             }),
          user: User.find(params[:user_id]),
        }
      }
    end
  end

  ###### Page des prochains cours ######
  def get_upcoming_activities_for_user
    upcoming_activities = []
    user = User.find(params[:user_id])
    annual_activities = user.activity_applications.where(season_id: Season.current)

    # get all upcoming activities
    # On récupère toutes les activités à venir qui ont été réservées par l'utilisateur par le biais du formulaire de réservation pricinpal
    annual_activities.each do |activity|
      activity.desired_activities.each do |desired_activity|
        if desired_activity.activity&.time_interval&.start
          upcoming_activities.push(desired_activity.activity)
        end
      end
    end

    # On récupère toutes les activités résérvées par l'utilisateur par le biais du formulaire de réservation de packs
    attendance = StudentAttendance.where(user_id: params[:user_id])
    attendance.each do |attendance|
      upcoming_activities.push(attendance.activity_instance) if attendance.activity_instance && attendance.user_id == user.id.to_i
    end

    # on trie les activités par le mois de la date actuelle
    upcoming_activities = upcoming_activities.sort_by do |activity|
      (activity.time_interval.start - DateTime.now).to_i.abs
    end

    upcoming_activities = upcoming_activities.as_json({
                                                        include: {
                                                          teacher: {},
                                                          room: {},
                                                          time_interval: {},
                                                        }
                                                      })

    # On ajoute la référence de l'activité à chaque activité
    upcoming_activities.each do |activity|
      activity["activity_ref"] = Activity.find(activity['activity_id']).activity_ref if activity['activity_id']
      activity["activity_ref"] = ActivityRef.find(activity['activity_ref_id']) if activity['activity_ref_id']
    end

    respond_to do |format|
      format.json {
        render json: upcoming_activities
      }
    end
  end

  def get_upcoming_activities_for_user_by_month
    user = User.find(params[:user_id])
    upcoming_activities_this_month = []
    date = DateTime.now

    # Récupérer toutes les activités à venir pour ce mois-ci

    # Pour les activités à l'année
    annual_activities_this_month = user.activity_applications.where(season_id: Season.current)

    annual_activities_this_month.each do |activity|
      activity.desired_activities.each do |desired_activity|
        next if desired_activity.activity.nil?
        next if desired_activity.activity.time_interval.start < date.beginning_of_month || desired_activity.activity.time_interval.start > date.end_of_month

        upcoming_activities_this_month.push(desired_activity.activity)
      end
    end

    # Pour les activités réservées par le biais du formulaire de réservation de packs
    attendance = StudentAttendance.where(user_id: params[:user_id])

    attendance.each do |attendance|
      next unless attendance.activity_instance
      next unless attendance.user_id == user.id.to_i
      next unless (date.beginning_of_month..date.end_of_month).cover?(attendance.activity_instance.time_interval.start)

      upcoming_activities_this_month.push(attendance.activity_instance)
    end

    upcoming_activities_this_month = upcoming_activities_this_month.as_json({
                                                                              include: {
                                                                                teacher: {},
                                                                                location: {},
                                                                                room: {},
                                                                                time_interval: {},
                                                                              }
                                                                            })

    # On ajoute la référence de l'activité à chaque activité
    upcoming_activities_this_month.each do |activity|
      activity["activity_ref"] = Activity.find(activity['activity_id']).activity_ref if activity['activity_id']
      activity["activity_ref"] = ActivityRef.find(activity['activity_ref_id']) if activity['activity_ref_id']
    end

    upcoming_activities_this_month
  end

  ##########################
  #  HANDLERS FOR ACTIONS  #
  ##########################

  ###### Page Réservations ######

  # Réserver les activités sélectionnées
  def submit_user_wish_list
    user_pack = Pack.find(params[:pack_id])

    if user_pack.lessons_remaining > 0
      params[:wish_list].each do |activityInstance|
        # inscrire l'élève au cours sélectionné, si ce n'est pas encore le cas
        Student.find_or_create_by!(user_id: params[:user_id], activity_id: activityInstance["activity_id"])

        attendance = StudentAttendance.create(user_id: params[:user_id], activity_instance_id: activityInstance["id"], is_pack: true)
        attendance.save!

        # ajouter la séance au planning de l'élève
        planning = Planning.find_by(user_id: params[:user_id])
        session = ActivityInstance.find(activityInstance["id"])
        planning.time_intervals << session.time_interval

        if attendance
          user_pack.lessons_remaining -= 1
          user_pack.save!
        end
      end
    else
      render json: {
        status: "error",
        message: "Vous n'avez plus de cours disponibles dans votre pack."
      }, status: 400

      return
    end

    render json: {
      status: "ok"
    }, status: 200
  end

  # Retirer une activité de la liste des activités souhaitées
  def remove_wished_attendance
    attendance = StudentAttendance.find_by(user_id: params[:user]["id"], activity_instance_id: params[:activity_instance]["id"], is_pack: true)
    user_pack = Pack.find(params[:pack_id])

    # supprimer la séance du planning de l'élève
    planning = Planning.find_by(user_id: params[:user]["id"])
    planning.time_intervals.delete(attendance.activity_instance.time_interval)

    if attendance.nil?
      render json: { status: "error" }
      return
    end

    attendance.destroy!
    user_pack.lessons_remaining += 1
    saved = user_pack.save!

    if saved
      EventHandler.notification.activity_cancelled.trigger(
        sender: {
          controller_name: self.class.name,
        },
        args: {
          user: attendance.user,
          activity: attendance.activity_instance.activity,
        }
      )

      render json: { status: "ok" }
    else
      render json: { status: "error" }
    end
  end

  private

  def format_and_capitalize_date(time_interval, format)
    l(time_interval, format: format).capitalize.to_s
  end

end