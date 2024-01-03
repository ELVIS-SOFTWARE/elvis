class PreApplicationActivitiesController < ApplicationController
  # (pour admin ??) mise à jour du statut de la préinscription
  def update
    pre_application_activity = PreApplicationActivity.find params[:id]
    pp params[:status].nil?
    pre_application_activity.status = params[:status].nil? ? true : params[:status]
    pre_application_activity.comment = params[:comment]
    pre_application_activity.action = params[:pre_app_action]
    pre_application_activity.save

    if params[:pre_app_action] == "stop"
      activity_application = ActivityApplication.find(params[:activity_application_id])
      activity_application.activity_application_status_id = ActivityApplicationStatus::STOPPED_ID
      activity_application.save!
    end

    render :json => pre_application_activity
  end

  # (pour admin) lister les demandes d'arrêt de préinscription - utilisé par le composant StopList, appelé par un clic sur le bouton "liste des arrêts" dans la page "Demandes d'inscription"
  def list_stop
    query = PreApplicationActivity
              .includes({
                          :pre_application => [:season, :user],
                          :activity => {
                            :activity_ref => {},
                            :teachers_activities => :teacher
                          }
                        })
              .where(action: "stop")
              .where.not(comment: [nil, ""])

    authorize! :read, query

    res = query.as_json({
                          :include => {
                            :pre_application => {
                              :include => [:season, :user],
                            },
                            :activity => {
                              :include => {
                                :activity_ref => {},
                              },
                              :methods => :teacher,
                            }
                          },
                        })

    render :json => res
  end

  # (pour admin) créer une préinscription à partir d'une activité - utilisé par un composant qui n'était pas utilisé jusqu'à présent (AddPreAppFromStopApp), pour présinscrire qqun qui avait choisi d'arrêter en cours d'année
    def create_from_activity
    can? :read, PreApplicationActivity
    user = User.find(params[:user_id])
    season = params[:season_id] ? Season.find(params[:season_id])
               : Season.current_apps_season
    activity = Activity.find(params[:activity_id])
    pre_application = user.pre_applications.where(season_id: season.id).first
    if pre_application.nil?
      user.pre_applications.create!(
        user: user,
        season: season,
      )
      pre_application = user.pre_applications.where(season_id: season.id).first
    end

    pre_app_activity = PreApplicationActivity.create(
      activity: activity,
      pre_application: pre_application
    )

    res = pre_app_activity.save
    render :json => res
  end

  # (pour admin) vérifier si une préinscription existe - utilisé par un composant qui n'était pas utilisé jusqu'à présent (AddPreAppFromStopApp), pour présinscrire qqun qui avait choisi d'arrêter en cours d'année
  def exist
    can? :read, PreApplicationActivity
    user = User.find(params[:user_id])
    season = params[:season_id] ?
               Season.find(params[:season_id])
               : Season.current_apps_season
    pre_app = user.pre_applications.where(season_id: season.id).first

    if pre_app.nil?
      render json: false
    else
      activity = Activity.find(params[:activity_id])
      render :json => PreApplicationActivity.where(
        pre_application_id: pre_app,
        activity_id: activity
      ).any?
    end
  end
end