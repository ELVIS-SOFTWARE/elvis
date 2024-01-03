import React, { Fragment } from "react";
import _ from "lodash";
import CurrentActivityItem from "./activityItems/CurrentActivityItem";
import NewActivityItem from "./activityItems/NewActivityItem";
import RenewActivityItem from "./activityItems/RenewActivityItem";

const moment = require("moment");
require("moment/locale/fr");

class PreApplication extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { season, current_user } = this.props;
        const today = new Date().toISOString();
        const newapp_opening_date = new Date(season.opening_date_for_new_applications).toISOString();
        const preapp_opening_date = new Date(season.opening_date_for_applications).toISOString();
        const closing_date = new Date(season.closing_date_for_applications).toISOString();

        const isNewApplicationOpened = (
            today >= newapp_opening_date &&
            today <= closing_date);
        const allowNewApplication = current_user.is_admin || isNewApplicationOpened;

        const isPreApplicationOpened = (
            today >= preapp_opening_date &&
            today <= closing_date);
        const allowPreApplication = current_user.is_admin || isPreApplicationOpened;

        const hasChildhoodLesson = this.props
            .pre_application
            .pre_application_activities
            .find(a => _.get(a, "activity.activity_ref.activity_type") === "child") !== undefined;

        const inscription_path = `/inscriptions/new?user_id=` + this.props.user.id
        const user_path = '/users/' + current_user.id;

        // Liste les activités actuellement suivie par l'utilisateur
        let currentActivityList = _.chain(
            this.props.current_activity_applications
        )
            .sortBy(paa => paa.id)
            .map((current_application_activity, i) => (
                <CurrentActivityItem
                    key={i}
                    current_user={this.props.current_user}
                    authToken={this.props.user.authentication_token}
                    data={current_application_activity.desired_activities[0]}
                    pre_application_activity={current_application_activity.pre_application_activity}
                    user_id={this.props.user.id}
                    allowPreApplication={allowPreApplication}
                    current_activity_application={current_application_activity}
                />
            ))
            .value();

        // Liste les activités où l'utilisateur à choisi de se réinscrire
        const renewActivityList = _.chain(
            this.props.pre_application.pre_application_activities
        )
            .sortBy(paa => paa.id)
            .filter(paa => paa.action === "renew" || paa.action === "pursue_childhood")
            .map((pre_application_activity, i) => (
                <RenewActivityItem
                    key={i}
                    current_user={this.props.current_user}
                    authToken={this.props.user.authentication_token}
                    data={pre_application_activity.activity}
                    pre_application_activity={pre_application_activity}
                    user_id={this.props.user.id}
                    allowPreApplication={allowPreApplication}
                    confirm_activity_text={this.props.confirm_activity_text ? this.props.confirm_activity_text.value : null}
                />
            ))
            .value();

        // Liste les nouvelles demandes d'inscription de l'utilisateur
        let newActivityList = _.chain(
            this.props.new_activities_applications
        )
            .sortBy(paa => paa.id)
            .map((new_activity_application, i) => (
                <NewActivityItem
                    key={i}
                    current_user={this.props.current_user}
                    authToken={this.props.user.authentication_token}
                    data={new_activity_application.desired_activities[0].activity}
                    user_id={this.props.user.id}
                    new_activity_application={new_activity_application}
                    confirm_activity_text={this.props.confirm_activity_text ? this.props.confirm_activity_text.value : null}
                />
            ))
            .value();


        // utilisé nulle part dans le code mais je laisse ça au cas ou
        const changedActivities = _.chain(
            this.props.pre_application.pre_application_activities
        )
            .sortBy(paa => paa.id)
            .filter(paa => paa.action === "change")
            .map((pre_application_activity, i) => {
                let data = _.head(
                    pre_application_activity.activity_application
                        .desired_activities
                );
                return (
                    <DesiredActivityItem
                        key={i}
                        data={data}
                        pre_application_activity={pre_application_activity}
                        user_id={this.props.user.id}
                    />
                );
            })
            .value();

        const othersActivities = _.chain(
            this.props.family_users
        )
            //.sortBy(paf => paf.full_name)
            .map((user, i) => {
                return <OtherActivityItem
                    key={i}
                    //pre_application={pre_application}
                    user={user}
                    season={this.props.season}
                />
            })
            .value();

        return (
            <React.Fragment>
                <div className="padding-page">
                    <div className="activity-header">
                        <h1>
                            {this.props.user.first_name}{" "}
                            {this.props.user.last_name}
                        </h1>
                        {
                            (isPreApplicationOpened || isNewApplicationOpened) ?
                                <div>
                                    <h3>
                                        Inscription aux cours pour la prochaine saison
                                        {` ${moment(this.props.season.start).format("YYYY")}-${moment(this.props.season.end).format("YYYY")}`}
                                    </h3>
                                    <div className="p">
                                        <p>La période des ré-inscriptions est{" "}
                                            {isPreApplicationOpened ? <span className="badge badge-success">ouverte</span> :
                                                                      <span className="badge badge-danger">fermée</span>}
                                        </p>
                                        <p>La période des nouvelles inscriptions est{" "}
                                            {isNewApplicationOpened ? <span className="badge badge-success">ouverte</span> :
                                                                      <span className="badge badge-danger">fermée</span>}
                                        </p>
                                    </div>
                                </div>
                                : null

                        }
                    </div>

                    <h2>Activités actuelles pour la saison {` ${moment(this.props.previous_season.start).format("YYYY")}-${moment(this.props.previous_season.end).format("YYYY")}`}</h2>
                    {currentActivityList.length <= 0 ? (
                        <p>
                            <i>
                                L'utilisateur ne poursuit actuellement aucune activité
                            </i>
                        </p>
                    ) : null}
                    {currentActivityList.length > 0
                        ? currentActivityList
                        : null}

                    <div className="d-inline-flex p-2">
                        <h2>Mes demandes pour la saison {` ${moment(this.props.season.start).format("YYYY")}-${moment(this.props.season.end).format("YYYY")}`}
                        {hasChildhoodLesson ? null : (
                            <button
                                disabled={!allowNewApplication}
                                className="btn btn-primary btn-sm ml-3"
                                title={!allowNewApplication ? "La période d'inscription aux nouvelles activités n'a pas commencé"
                                    : null}
                                onClick={() => {
                                    if (allowNewApplication) {
                                        window.location = inscription_path;
                                    }
                                }}
                            >
                                <i className="fas fa-plus" />
                                &nbsp;Inscription à une nouvelle activité
                            </button>
                        )}
                        </h2>
                    </div>

                    {/* Affichage des réinscriptions et des nouvelles activités */}
                    {renewActivityList.length > 0
                        ? renewActivityList
                        : null}
                    {newActivityList.length > 0
                        ? newActivityList
                        : null}

                    <div>
                        {
                            <a
                                href={user_path}
                                className="btn btn-primary btn-lg btn-outline m-l-xs">
                                <i className="fas fa-users" /> Retour vers mon profil
                            </a>
                        }
                    </div>

                    {this.props.family_users.length > 0 ? <Fragment>
                        <h2>Autres inscriptions dans la famille</h2>

                        {othersActivities}

                    </Fragment> : null}
                </div>
            </React.Fragment>
        );
    }
}

function displayDateForSeason(pa, season) {
    const paDate = new Date(_.get(pa, "activity.time_interval.start"));

    // valeur arbitraire fonctionnant seuelement pour les écoles qui ont des saison correspondant à l'année scolaire
    // devrait, nan doit disparaitre avec le refacto de la page
    if (paDate.getMonth() < 8) {
        return `${paDate.getFullYear() - 1}-${paDate.getFullYear()}`;
    }
    else {
        return `${paDate.getFullYear()}-${paDate.getFullYear() + 1}`;
    }
}

function OtherActivityItem({ user, season }) {
    let strting_activities = (_.get(user, "pre_application.pre_application_activities") || [])
        .map(pa => `${_.get(pa, "activity.activity_ref.label")} (${displayDateForSeason(pa, season)})`).join(" - ");

    if (strting_activities.length === 0) {
        strting_activities = (_.get(user, "pre_application.pre_application_desired_activities") || [])
            .map(pa => `${_.get(pa, "desired_activity.activity_ref.label")} (X))`).join(" - ");
    }

    return <div className="row">
            <div className="col-sm-9">
                <div className="ibox">
                    <div className="ibox-content text-align-center-sm">
                        <div className="row">
                            <div className="col-sm-6 p-xs">
                                <h5 className="text-dark">{user.full_name}</h5>
                                <span>{strting_activities}</span>
                            </div>

                            <div className={"col-sm-6 p-xs pt-sm-4 text-rigth"}>
                                <a href={`/new_application/${user.id}`}
                                    className={"btn btn-primary btn-sm"}>Gérer son inscription</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    </div>
}
export default PreApplication;
