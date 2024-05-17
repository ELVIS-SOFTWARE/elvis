import React, {Fragment} from "react";
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
        const {season, current_user} = this.props;
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
                    user={this.props.user}
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
                    user={this.props.user}
                    allowPreApplication={allowPreApplication}
                    confirm_activity_text={this.props.confirm_activity_text ? this.props.confirm_activity_text.value : null}
                    default_activity_status_id={this.props.default_activity_status_id}
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
                    user={this.props.user}
                    new_activity_application={new_activity_application}
                    confirm_activity_text={this.props.confirm_activity_text ? this.props.confirm_activity_text.value : null}
                    default_activity_status_id={this.props.default_activity_status_id}
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

        let openingApplication = moment(this.props.season.opening_date_for_new_applications);
        let closingApplication = moment(this.props.season.closing_date_for_applications);
        let openingDate = openingApplication.date();
        let closingDate = closingApplication.date();
        let openingPeriod = openingDate < 10 ? 'début' : openingDate > 20 ? 'fin' : 'mi';
        let closingPeriod = closingDate < 10 ? 'début' : closingDate > 20 ? 'fin' : 'mi';

        function displayActivityList(renewActivityList, newActivityList, emptyMessage) {
            let result = [];
            if (renewActivityList.length > 0) {
                result.push(renewActivityList);
            }
            if (newActivityList.length > 0) {
                result.push(newActivityList);
            }
            if (result.length === 0) {
                result.push(
                    <tr>
                        <td colSpan="12" className="text-center">
                            <i>{emptyMessage}</i>
                        </td>
                    </tr>
                );
            }
            return result;
        }

        return (
            <React.Fragment>
                <div className="padding-page ml-4">
                    <div className="activity-header">
                        <div className="d-inline-flex justify-content-between align-items-center w-100">
                            <h1 style={{color: "#00283B"}}>Mes demandes d'inscription</h1>
                            <div>
                                {hasChildhoodLesson ? null : (
                                    <button disabled={!allowNewApplication} className="btn btn-sm font-weight-bold"
                                            style={{backgroundColor: "#00334A", color: "white", borderRadius: "8px"}}
                                            title={!allowNewApplication ? "La période d'inscription aux nouvelles activités n'a pas commencé"
                                                : null}
                                            onClick={() => {
                                                if (allowNewApplication) {
                                                    window.location = inscription_path;
                                                }
                                            }}
                                    >
                                        <i className="fas fa-plus"/><span className="ml-3">Nouvelle Demande</span>
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="row ml-1">
                            <h4 className="mb-5" style={{color: "#8AA4B1"}}>
                                Inscription aux activités de la
                                saison {` ${moment(this.props.season.start).format("YYYY")}/${moment(this.props.season.end).format("YYYY")}`}
                            </h4>
                            <div className="col-md-6 d-inline-flex justify-content-between p-0">
                                <div className="card col mr-4"
                                     style={{border: "none", borderRadius: "12px"}}>
                                    <div className="row d-inline-flex align-items-center p-3">
                                        <div style={{
                                            backgroundColor: "#E2EDF3",
                                            borderRadius: "50px",
                                            width: "50px",
                                            height: "50px",
                                            margin: "10px 20px 10px 10px"
                                        }}>
                                        </div>
                                        <div>
                                            <h5 className="card-title" style={{color: "#00283B"}}>Période de
                                                ré-inscription <i className="fas fa-info-circle"></i></h5>
                                            <h6 className="card-subtitle mb-2 text-muted">Ferme {closingPeriod} {closingApplication.format("MMMM YYYY")}</h6>
                                            <div>{isPreApplicationOpened ?
                                                <span className="badge badge-success">ouverte</span> :
                                                <span className="badge badge-danger">fermée</span>}
                                            </div>

                                        </div>
                                    </div>
                                </div>
                                <div className="card col"
                                     style={{border: "none", borderRadius: "12px"}}>
                                    <div className="row d-inline-flex align-items-center p-3">
                                        <div style={{
                                            backgroundColor: "#E2EDF3",
                                            borderRadius: "50px",
                                            width: "50px",
                                            height: "50px",
                                            margin: "10px 20px 10px 10px"
                                        }}>
                                        </div>
                                        <div>
                                            <h5 className="card-title" style={{color: "#00283B"}}>Période
                                                d'inscription <i className="fas fa-info-circle"></i></h5>
                                            <h6 className="card-subtitle mb-2 text-muted">Ouvre {openingPeriod} {openingApplication.format("MMMM YYYY")}</h6>
                                            <div>{isNewApplicationOpened ?
                                                <span className="badge badge-success">ouverte</span> :
                                                <span className="badge badge-danger">fermée</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-12 mb-4 p-0">
                        <h3 style={{color: "#8AA4B1", fontWeight: "bold"}}>
                            Activités actuelles
                            (saison {`${moment(this.props.previous_season.start).format("YYYY")}/${moment(this.props.previous_season.end).format("YYYY")}`})
                        </h3>
                        <div className="col-md-6 p-0">
                            <table className="table table-striped" style={{borderRadius: '12px', overflow: 'hidden'}}>
                                <thead>
                                <tr style={{backgroundColor: "#00334A", color: "white"}}>
                                    <th style={{borderRadius: "12px 0 0 0"}}>Activité</th>
                                    <th>Membre</th>
                                    <th>Séances restantes</th>
                                    <th style={{borderRadius: "0 12px 0 0"}}></th>
                                </tr>
                                </thead>
                                <tbody>
                                {currentActivityList.length > 0
                                    ? currentActivityList
                                    :
                                    <tr>
                                        <td colSpan="12" className="text-center">
                                            <i>{this.props.user.first_name} {this.props.user.last_name} ne poursuit
                                                actuellement aucune activité</i>
                                        </td>
                                    </tr>
                                }
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="col-md-12 mb-4 p-0">
                        <h3 style={{color: "#8AA4B1", fontWeight: "bold"}}>Mes demandes</h3>
                        <table className="table table-striped" style={{borderRadius: '12px', overflow: 'hidden'}}>
                            <thead>
                            <tr style={{backgroundColor: "#00334A", color: "white"}}>
                                <th>Réf.</th>
                                <th style={{borderRadius: "12px 0 0 0"}}>Activité</th>
                                <th>Membre</th>
                                <th>Date</th>
                                <th>Statut</th>
                                <th>Créneaux</th>
                                <th style={{borderRadius: "0 12px 0 0"}}></th>
                            </tr>
                            </thead>
                            <tbody>
                            {displayActivityList(renewActivityList, newActivityList, `${this.props.user.first_name} ${this.props.user.last_name} n'a aucune demande d'inscription en cours`)}
                            </tbody>
                        </table>
                    </div>

                    <div className="col-md-12 p-0">
                        {this.props.family_users.length > 0 ?
                            <Fragment>
                                <h3 style={{color: "#8AA4B1", fontWeight: "bold"}}>Autres inscription dans la famille</h3>
                                {othersActivities}
                            </Fragment> : null}
                    </div>

                    <div>
                        <a href={user_path} className="btn btn-primary btn-sm btn-outline mt-5"
                           style={{borderRadius: "8px"}}>
                            <i className="fas fa-users"/> Retour vers mon profil
                        </a>
                    </div>
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
    } else {
        return `${paDate.getFullYear()}-${paDate.getFullYear() + 1}`;
    }
}

function OtherActivityItem({user, season}) {
    // let strting_activities = (_.get(user, "pre_application.pre_application_activities") || [])
    //     .map(pa => `${_.get(pa, "activity.activity_ref.label")} (${displayDateForSeason(pa, season)})`).join(" - ");
    //
    // if (strting_activities.length === 0) {
    //     strting_activities = (_.get(user, "pre_application.pre_application_desired_activities") || [])
    //         .map(pa => `${_.get(pa, "desired_activity.activity_ref.label")} (X))`).join(" - ");
    // }

    return <div className="card col-md-3 mr-4"
                style={{border: "none", borderRadius: "12px"}}>
        <div className="d-inline-flex align-items-center justify-content-between p-3">
            {user.avatar ? (
                    <img src={user.avatar} alt="avatar" style={{
                        borderRadius: "50%",
                        width: "50px",
                        height: "50px",
                        margin: "10px 10px 10px 0"
                    }}/>
                ) :
                <div style={{
                    backgroundColor: "#fac5c7",
                    borderRadius: "50%",
                    width: "50px",
                    height: "50px",
                    margin: "10px 20px 10px 0",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#FF6066",
                    fontWeight: "bold",
                    fontSize: "20px"
                }}>
                    {user.full_name.split(' ').map(name => name[0]).join('')}
                </div>
            }

            <div>
                <h5 className="m-0">{user.full_name}</h5>
            </div>
            <div className="text-rigth">
                <a href={`/new_application/${user.id}`} className="btn btn-primary btn-sm"
                   style={{borderRadius: "8px"}}>
                    Gérer son inscription
                </a>
            </div>
        </div>
    </div>

}

export default PreApplication;
