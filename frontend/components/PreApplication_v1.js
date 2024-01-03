import React, { Fragment } from "react";
import _ from "lodash";

const moment = require("moment");
require("moment/locale/fr");

import Modal from "react-modal";
import { csrfToken, optionMapper } from "./utils";

import { PRE_APPLICATION_ACTIONS } from "../tools/constants";
import swal from "sweetalert2";
import * as ActivityApplicationStatus from './utils/ActivityApplicationsStatuses';
import * as StopReasons from './utils/StopReasons';

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


        const activityList = _.chain(
            this.props.pre_application.pre_application_activities
        )
            .sortBy(paa => paa.id)
            .filter(paa => paa.action !== "new" && paa.action !== "change")
            .map((pre_application_activity, i) => (
                <ActivityItem
                    key={i}
                    current_user={this.props.current_user}
                    authToken={this.props.user.authentication_token}
                    // authToken={csrfToken}
                    data={pre_application_activity.activity}
                    pre_application_activity={pre_application_activity}
                    user_id={this.props.user.id}
                    allowPreApplication={allowPreApplication}
                    confirm_activity_text={this.props.confirm_activity_text ? this.props.confirm_activity_text.value : null}
                />
            ))
            .value();

        let desiredActivityList = _.chain(
            this.props.pre_application.pre_application_desired_activities
        )
            .sortBy(pada => pada.id)
            .filter(pada => pada.desired_activity && pada.action === "new")
            .map((pre_application_desired_activity, i) => (
                <DesiredActivityItem
                    key={i}
                    authToken={this.props.user.authentication_token}
                    // authToken={csrfToken}
                    data={pre_application_desired_activity.desired_activity}
                    pre_application_activity={pre_application_desired_activity}
                    user_id={this.props.user.id}
                    confirm_activity_text={this.props.confirm_activity_text ? this.props.confirm_activity_text.value : null}
                />
            ))
            .value();

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

        desiredActivityList = _.flatten(
            desiredActivityList.concat(changedActivities)
        );

        // const othersActivities = _.chain(
        //     this.props.pre_applications_for_family
        // )
        //     .sortBy(paf => paf.full_name)
        //     .map((pre_application, i) => {
        //         return <OtherActivityItem
        //             key={i}
        //             pre_application={pre_application}
        //             season={this.props.season}
        //         />
        //     })
        //     .value();

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
                                            {isPreApplicationOpened ? "ouverte" : "fermée"}
                                        </p>
                                        <p>La période des nouvelles inscriptions est{" "}
                                            {isNewApplicationOpened ? "ouverte" : "fermée"}
                                        </p>
                                    </div>
                                </div>
                                : null

                        }
                    </div>


                    <h2>Vos activités actuelles</h2>
                    {activityList.length <= 0 ? (
                        <p>
                            <i>
                                L'utilisateur ne poursuit actuellement aucune activité
                            </i>
                        </p>
                    ) : null}
                    {this.props.pre_application.pre_application_activities
                        .length > 0
                        ? activityList
                        : null}

                    {desiredActivityList.length <= 0 ? null : (
                        <h2>Nouvelles activités</h2>
                    )}
                    {desiredActivityList.length > 0
                        ? desiredActivityList
                        : null}

                    <div>
                        {
                            hasChildhoodLesson ||
                            <button
                                disabled={!allowNewApplication}
                                className="btn btn-primary btn-lg"
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
                        }
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

class DesiredActivityItem extends React.Component {
    constructor(props) {
        super(props);

        const activity_application_status_id = _.get(this.props, "pre_application_activity.activity_application.activity_application_status_id");

        this.state = {
            pre_application_activity: this.props.pre_application_activity,
            isAssignationRefusedModalOpen: false,
            isAssignationAcceptedModalOpen: false,
            reasonOfRefusal: "",
            proposalAnswered: (activity_application_status_id === ActivityApplicationStatus.PROPOSAL_ACCEPTED_ID
                || activity_application_status_id === ActivityApplicationStatus.PROPOSAL_REFUSED_ID)
        };
        this.updateReasonRefused = this.updateReasonRefused.bind(this);
    }

    openAssignationRefusedModal() {
        this.setState({ isAssignationRefusedModalOpen: true });
    }

    closeAssignationRefusedModal() {
        this.setState({ isAssignationRefusedModalOpen: false });
    }

    openAssignationAcceptedModal() {
        this.setState({ isAssignationAcceptedModalOpen: true });
    }

    closeAssignationAcceptedModal() {
        this.setState({ isAssignationAcceptedModalOpen: false });
    }

    updateReasonRefused(event) {
        this.setState({ reasonOfRefusal: event.target.value });
    }

    handleProcessRefusedAssignationActivity() {
        this.closeAssignationRefusedModal();

        let application = {
            activity_application_status_id: ActivityApplicationStatus.PROPOSAL_REFUSED_ID
        }

        fetch(
            `/inscriptions/${this.props.pre_application_activity.activity_application_id}`,
            {
                method: "PATCH",
                credentials: "same-origin",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },

                body: JSON.stringify({
                    application: application,
                    id: this.props.pre_application_activity.activity_application_id,
                    activity_application: this.props.pre_application_activity.activity_application,
                    reason_of_refusal: this.state.reasonOfRefusal
                }),
            }
        ).then(response => {
            if (!response.ok)
                swal("Erreur", "Erreur lors de l'acheminement", "error")

            return response.json()
        }).then(json => {
            this.setState({ proposalAnswered: json.activity_application_status_id === ActivityApplicationStatus.PROPOSAL_REFUSED_ID });
            swal("Proposition refusée", "Les raisons ont été communiquées", "info")
        });
    }

    handleProcessAcceptedAssignationActivity() {
        this.closeAssignationAcceptedModal();

        let application = {
            activity_application_status_id: ActivityApplicationStatus.PROPOSAL_ACCEPTED_ID
        }

        fetch(
            `/inscriptions/${this.props.pre_application_activity.activity_application_id}`,
            {
                method: "PATCH",
                credentials: "same-origin",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },

                body: JSON.stringify({
                    application: application,
                    id: this.props.pre_application_activity.activity_application_id,
                    activity_application: this.props.pre_application_activity.activity_application
                }),
            }
        ).then(response => {
            if (!response.ok)
                swal("Erreur", "Erreur lors de l'acheminement", "error")

            return response.json()
        }).then(json => {
            this.setState({ proposalAnswered: json.activity_application_status_id === ActivityApplicationStatus.PROPOSAL_ACCEPTED_ID });
            swal("Réussite", "Proposition acceptée", "success");
        });
    }

    render() {
        const {
            data,
            pre_application_activity,
            // openRenewModal,
            openStopModal,
            user_id,
        } = this.props;

        /**
         *  Affichage du jour, créneau, professeur, et salle
         */
        let activityDetails = "";
        let activityState = _.get(this.props, "pre_application_activity.activity_infos");

        if (activityState !== undefined && activityState !== null) {
            let dayLabel = moment(activityState.time_interval.start).format('dddd')
            activityDetails = <React.Fragment>
                <p className="pb-0">
                    {dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)} de&nbsp;
                    {moment(activityState.time_interval.start).format('HH:mm')} à&nbsp;
                    {moment(activityState.time_interval.end).format('HH:mm')} avec&nbsp;
                    {activityState.teacher.first_name}
                    &nbsp;{activityState.teacher.last_name},
                    en salle : {activityState.room.label}
                </p>
            </React.Fragment>;
        }

        let actionButtons = null;

        let activity_application_status_id = _.get(this.state, "pre_application_activity.activity_application.activity_application_status_id");

        if (activity_application_status_id === ActivityApplicationStatus.ACTIVITY_ATTRIBUTED_ID ||
            (activity_application_status_id === ActivityApplicationStatus.PROPOSAL_ACCEPTED_ID ||
                activity_application_status_id === ActivityApplicationStatus.PROPOSAL_REFUSED_ID)
        ) {
            !this.state.proposalAnswered ?
                actionButtons =
                    <React.Fragment>
                        <button
                            onClick={() => this.openAssignationRefusedModal()}
                            className="btn btn-danger btn-sm m-xs"
                            disabled={this.state.proposalAnswered}
                        >
                            <i className="fas fa-times mr-2" />
                            Je refuse
                        </button>
                        <button
                            onClick={() => this.openAssignationAcceptedModal()}
                            className="btn btn-primary btn-sm m-xs"
                            disabled={this.state.proposalAnswered}
                        >
                            <i className="fas fa-check mr-2" />
                            Je valide
                        </button>
                    </React.Fragment> : "";
        }

        let actionLabel = "";
        if (this.state.pre_application_activity.activity_application &&
            this.state.pre_application_activity.activity_application.activity_application_status &&
            _.includes(
                ["Cours attribué", "Cours en attente", "Proposition acceptée"],
                this.state.pre_application_activity.activity_application.activity_application_status.label
            )
        ) {
            actionLabel = "Traitée";

            if (this.state.pre_application_activity.activity_application.activity_application_status.label === "Proposition acceptée")
                actionLabel = "Proposition acceptée";
        } else {

            actionLabel = "En attente";

            if (this.state.pre_application_activity.action) {
                if (this.state.pre_application_activity.action === "stop")
                    actionLabel = "Arrêt";
                else
                    actionLabel = "En traitement";
            }
        }

        return (
            <div className="ibox">
                <div className="ibox-title">
                    <h4>
                        {data.activity_ref.activity_type === "child"
                            ? data.activity_ref.label
                            : data.activity_ref.kind}
                    </h4>
                </div>
                <div className="ibox-content text-align-center-sm">
                    <div className="row">
                        <div className="col-sm-2 project-status p-xs">
                            {renderActivityAction(actionLabel)}
                        </div>
                        <div className="col-sm-4 p-xs">
                            <p className="project-number">
                                Demande &nbsp;
                                <b>
                                    {(this.props.current_user || {}).is_admin ?
                                        <a href={`/inscriptions/${this.state.pre_application_activity.activity_application.id}`}>{`#${this.state.pre_application_activity.activity_application.id}`}</a> :
                                        `#${this.state.pre_application_activity.activity_application.id}`}
                                </b>
                            </p>
                            {activityDetails}
                        </div>
                        <div className="col-sm-6 p-xs">
                            {actionButtons}
                        </div>
                    </div>
                </div>
                <Modal
                    isOpen={this.state.isAssignationRefusedModalOpen}
                    onRequestClose={() => this.closeAssignationRefusedModal()}
                    className="activity-modal"
                    ariaHideApp={false}
                    contentLabel="Inscription Activité"
                >
                    <h2 className="modal-header">
                        Refus de l'activité
                    </h2>
                    <div className="content">
                        <div className="form-group">
                            <textarea name="reason" rows="4" cols="50"
                                      className={"form-control"}
                                      placeholder={"Pouvez vous nous indiquer les raisons de ce refus ?"}
                                      onChange={this.updateReasonRefused}
                            />
                        </div>
                    </div>
                    <button
                        onClick={() => this.closeAssignationRefusedModal()}
                        className="btn btn-white"
                    >
                        Retour
                    </button>
                    <button
                        onClick={() =>
                            this.handleProcessRefusedAssignationActivity()
                        }
                        className="btn btn-primary pull-right"
                    >
                        Je confirme
                    </button>
                </Modal>

                <Modal
                    isOpen={this.state.isAssignationAcceptedModalOpen}
                    onRequestClose={() => this.closeAssignationAcceptedModal()}
                    className="modal-sm"
                    ariaHideApp={false}
                    contentLabel="Inscription Activité"
                >
                    <h2 className="modal-header">
                        Êtes vous sûr d'accepter la proposition ?
                    </h2>
                    <div className="content">
                        <div className="form-group">
                            { this.props.confirm_activity_text ?
                                <p className="mt-5 text-justify">{this.props.confirm_activity_text}</p> : ""
                            }
                        </div>
                    </div>
                    <button
                        onClick={() => this.closeAssignationAcceptedModal()}
                        className="btn btn-white"
                    >
                        Retour
                    </button>
                    <button
                        onClick={() =>
                            this.handleProcessAcceptedAssignationActivity()
                        }
                        className="btn btn-primary pull-right"
                    >
                        Je confirme
                    </button>
                </Modal>
            </div>
        );
    }
}

function renderActivityAction(actionLabel) {
    switch (actionLabel) {
        case "Proposition acceptée":
            return (
                <React.Fragment>
                    <i className="fas fa-lg mt-4 fa-check-circle color-green" />
                    <span className="label label-primary bg-green">
                        Proposition acceptée
                    </span>
                </React.Fragment>
            );
        case "Traitée":
            return (
                <React.Fragment>
                    <i className="fas fa-lg mt-4 fa-check-circle color-green" />
                    <span className="label label-primary bg-green">
                        Cours attribué
                    </span>
                </React.Fragment>
            );
        case "En traitement":
            return (
                <React.Fragment>
                    <i className="fas mt-4 fa-check-circle text-info" />
                    <span className="label label-info">En traitement</span>
                </React.Fragment>
            );
        case "Arrêt":
            return (
                <React.Fragment>
                    <i className="fas  fa-times-circle fa-lg bg-danger img-circle mt-0 mb-2 p-1" />
                    <span className="label label-danger">Arrêt</span>
                </React.Fragment>
            );
        default:
            return (
                <React.Fragment>
                    <i className="fas mt-4 fa-hourglass fa-sm bg-warning img-circle"
                       style={{ padding: "1px 6px 1px 6px" }} />
                    <span className="label label-warning">En attente de traitement</span>
                </React.Fragment>
            );
    }
}

class ActivityItem extends React.Component {
    nextCycles = null;

    constructor(props) {
        super(props);

        const activity_application_status_id = _.get(this.props, "pre_application_activity.activity_application.activity_application_status_id");

        this.state = {
            preApplicationActivity: this.props.pre_application_activity,
            // isRenewModalOpen: false,
            isStopModalOpen: false,
            isAssignationRefusedModalOpen: false,
            isAssignationAcceptedModalOpen: false,
            reasonOfRefusal: "",
            stopReasonValue: "0",
            stopReasonCustom: "",
            selectedNextActivityRef: this.getDefaultChildNextActivityRef(),
            proposalAnswered: (activity_application_status_id === ActivityApplicationStatus.PROPOSAL_ACCEPTED_ID
                || activity_application_status_id === ActivityApplicationStatus.PROPOSAL_REFUSED_ID)
        };
        this.updateReasonRefused = this.updateReasonRefused.bind(this);
    }

    // Indique s'il s'agit d'une préinscription "enfance"
    // @return boolean
    isChildPreApplicationActivity() {
        return _.get(this.state, "preApplicationActivity.activity.activity_ref.activity_type") === "child"
            || _.get(this.state, "preApplicationActivity.activity.activity_ref.kind") === "ENFANCE";
    }

    // Pour les enfants, renvoie les activités suivantes parmi celles qui sont possibles
    // @return un tableau d'activités (ActivityRef)
    getChildActivityNextCycles() {
        return this.state.preApplicationActivity.activity.activity_ref.next_cycles;
    }

    // Pour les enfants, renvoie l'activité suivante pour l'année prochaine (s'il n'y en a qu'une possible)
    // @return l'ID de l'ActivityRef ; ou undefined si ce n'est pas une activité enfance ou qu'il y en a plusieurs
    getDefaultChildNextActivityRef() {
        if (this.isChildPreApplicationActivity()) {
            const childActivityNextCycles = this.getChildActivityNextCycles();

            return childActivityNextCycles.length === 1
                ? childActivityNextCycles[0].id
                : undefined;
        }

        return undefined;
    }

    // openRenewModal() {
    //     this.setState({ isRenewModalOpen: true });
    // }
    // closeRenewModal() {
    //     this.setState({ isRenewModalOpen: false });
    // }
    openStopModal() {
        this.setState({ isStopModalOpen: true });
    }

    closeStopModal() {
        this.setState({ isStopModalOpen: false });
    }

    openApplyModal() {
        this.setState({ isApplyModalOpen: true });
    }

    closeApplyModal() {
        this.setState({ isApplyModalOpen: false });
    }

    openAssignationRefusedModal() {
        this.setState({ isAssignationRefusedModalOpen: true });
    }

    closeAssignationRefusedModal() {
        this.setState({ isAssignationRefusedModalOpen: false });
    }

    openAssignationAcceptedModal() {
        this.setState({ isAssignationAcceptedModalOpen: true });
    }

    closeAssignationAcceptedModal() {
        this.setState({ isAssignationAcceptedModalOpen: false });
    }

    handleChangeStopReason(event) {
        this.setState({ stopReasonValue: event.target.value });
    }

    handleChangeStopReasonCustom(event) {
        this.setState({ stopReasonCustom: event.target.value });
    }

    handleSelectActivityRef(event) {
        this.setState({ selectedNextActivityRef: parseInt(event.target.value) });
    }

    updateReasonRefused(event) {
        this.setState({ reasonOfRefusal: event.target.value });
    }

    handleProcessPreApplicationActivity(action) {
        this.closeStopModal();
        // this.closeRenewModal();

        let actions = [
            fetch(
                `/pre_application/${this.state.preApplicationActivity.id}/process?auth_token=${csrfToken}`,
                {
                    method: "PATCH",
                    credentials: "same-origin",
                    headers: {
                        "X-CSRF-Token": csrfToken,
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        pre_app_action: action,
                        comment:
                            this.state.stopReasonValue === StopReasons.OTHER_ID
                                ? this.state.stopReasonCustom
                                : this.state.stopReasonValue,
                    }),
                }
            ),
        ];
        if (action === "renew") {
            actions.push(
                fetch(`/pre_application/${this.props.user_id}/renew?auth_token=${csrfToken}`, {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "X-CSRF-Token": csrfToken,
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        pre_application_activity_id: this.props.pre_application_activity.id,
                        activity_ref_id: this.props.pre_application_activity.activity.activity_ref_id,
                    }),
                })
            );
        }

        Promise.all(actions)
            .then(async ([process, renew]) => {
                const processJson = process ? await process.json() : null;
                const renewJson = renew ? await renew.json() : null;
                return [processJson, renewJson];
            })
            .then(([preApplicationActivity, activityApplication]) => {
                let newState = {
                    ...preApplicationActivity,
                };

                if (
                    activityApplication !== undefined &&
                    activityApplication != null
                ) {
                    newState.activity_application = activityApplication;
                }

                this.setState({ preApplicationActivity: newState });
            });
    }

    handleProcessRefusedAssignationActivity() {
        this.closeAssignationRefusedModal();

        let application = {
            activity_application_status_id: ActivityApplicationStatus.PROPOSAL_REFUSED_ID
        }

        fetch(
            `/inscriptions/${this.props.pre_application_activity.activity_application_id}`,
            {
                method: "PATCH",
                credentials: "same-origin",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },

                body: JSON.stringify({
                    application: application,
                    id: this.props.pre_application_activity.activity_application_id,
                    activity_application: this.props.pre_application_activity.activity_application,
                    reason_of_refusal: this.state.reasonOfRefusal
                }),
            }
        ).then(response => {
            if (!response.ok)
                swal("Erreur", "Erreur lors de l'acheminement", "error")

            return response.json()
        }).then(json => {
            this.setState({ proposalAnswered: json.activity_application_status_id === ActivityApplicationStatus.PROPOSAL_REFUSED_ID });
            swal("Proposition refusée", "Les raisons ont été communiquées", "info")
        });
    }

    handleProcessAcceptedAssignationActivity() {
        this.closeAssignationAcceptedModal();

        let application = {
            activity_application_status_id: ActivityApplicationStatus.PROPOSAL_ACCEPTED_ID
        }

        fetch(
            `/inscriptions/${this.props.pre_application_activity.activity_application_id}`,
            {
                method: "PATCH",
                credentials: "same-origin",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },

                body: JSON.stringify({
                    application: application,
                    id: this.props.pre_application_activity.activity_application_id,
                    activity_application: this.props.pre_application_activity.activity_application
                }),
            }
        ).then(response => {
            if (!response.ok)
                swal("Erreur", "Erreur lors de l'acheminement", "error")

            return response.json()
        }).then(json => {
            this.setState({ proposalAnswered: json.activity_application_status_id === ActivityApplicationStatus.PROPOSAL_ACCEPTED_ID });
            swal("Réussite", "Proposition acceptée", "success");
        });
    }

    render() {
        const {
            data,
            pre_application_activity,
            user_id,
            authToken,
        } = this.props;
        // /!\ --------------------------------------- /!\
        const isPreapplicationEnabled =
            !this.state.preApplicationActivity.status &&
            this.props.allowPreApplication;

        let actionLabel = "";
        if (this.state.preApplicationActivity.activity_application &&
            this.state.preApplicationActivity.activity_application.activity_application_status &&
            _.includes(
                ["Cours attribué", "Cours en attente", "Proposition acceptée"],
                this.state.preApplicationActivity.activity_application.activity_application_status.label
            )
        ) {
            actionLabel = "Traitée";

            if (this.state.preApplicationActivity.activity_application.activity_application_status.label === "Proposition acceptée")
                actionLabel = "Proposition acceptée";
        } else {

            actionLabel = "En attente";

            if (this.state.preApplicationActivity.action) {
                if (this.state.preApplicationActivity.action === "stop")
                    actionLabel = "Arrêt";
                else
                    actionLabel = "En traitement";
            }
        }

        const isCustomComment = this.state.stopReasonValue === StopReasons.OTHER_ID;

        /**
         *  Affichage du jour, créneau, professeur, et salle
         */
        let activityDetails = "";
        let activityState = _.get(this.props, "pre_application_activity.next_activity");

        if (activityState !== undefined && activityState !== null) {
            let dayLabel = moment(activityState.time_interval.start).format('dddd')
            activityDetails = <React.Fragment>
                <p className="pb-0">
                    {dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)} de&nbsp;
                    {moment(activityState.time_interval.start).format('HH:mm')} à&nbsp;
                    {moment(activityState.time_interval.end).format('HH:mm')} avec&nbsp;
                    {activityState.teacher.first_name}
                    &nbsp;{activityState.teacher.last_name},
                    en salle : {activityState.room.label}
                </p>
            </React.Fragment>;
        }

        let StopButton =
            <button
                onClick={() => this.openStopModal()}
                className="btn btn-primary btn-sm m-xs"
            >
                <i className="fas fa-times" />
                Arrêter
            </button>

        let actionButtons = null;

        let activity_application_status_id = _.get(this.state, "preApplicationActivity.activity_application.activity_application_status_id");

        if (activity_application_status_id === ActivityApplicationStatus.ACTIVITY_ATTRIBUTED_ID ||
            (activity_application_status_id === ActivityApplicationStatus.PROPOSAL_ACCEPTED_ID ||
                activity_application_status_id === ActivityApplicationStatus.PROPOSAL_REFUSED_ID)
        ) {
            !this.state.proposalAnswered ?
                actionButtons =
                    <React.Fragment>
                        <button
                            onClick={() => this.openAssignationRefusedModal()}
                            className="btn btn-danger btn-sm m-xs"
                            disabled={this.state.proposalAnswered}
                        >
                            <i className="fas fa-times mr-2" />
                            Je refuse
                        </button>
                        <button
                            onClick={() => this.openAssignationAcceptedModal()}
                            className="btn btn-primary btn-sm m-xs"
                            disabled={this.state.proposalAnswered}
                        >
                            <i className="fas fa-check mr-2" />
                            Je valide
                        </button>
                    </React.Fragment> : "";

        } else if (isPreapplicationEnabled) {

            if (this.isChildPreApplicationActivity() && this.state.preApplicationActivity.activity_application === undefined) {
                this.nextCycles = this.getChildActivityNextCycles();

                let nextFamilies = _.uniqBy(this.nextCycles, "to.activity_ref_kind_id");
                let timeslotActivities = this.nextCycles.filter(a => a.to.allows_timeslot_selection === true);
                nextFamilies = nextFamilies.concat(timeslotActivities);
                nextFamilies = _.uniqBy(nextFamilies, "id");

                actionButtons =
                    <Fragment>
                        {nextFamilies.map(activity =>
                            <a
                                href={`/inscriptions/new/${user_id}/${this.state.preApplicationActivity.id
                                }/${activity.to.id}/${PRE_APPLICATION_ACTIONS.PURSUE_CHILDHOOD}?auth_token=${csrfToken}`}
                                className="btn btn-info m-sm">
                                <i className="fas fa-edit"/>
                                S'inscrire à l'activité&nbsp;
                                {activity.to.allows_timeslot_selection ? activity.to.label : activity.to.kind }
                            </a>
                        )}
                        {StopButton}
                    </Fragment>;
            } else {
                actionButtons =
                    <React.Fragment>
                        <a
                            href={`/inscriptions/new/${user_id}/${pre_application_activity.id
                            }/${data.activity_ref_id}/${PRE_APPLICATION_ACTIONS.RENEW}?auth_token=${csrfToken}`}
                            className="btn btn-info m-sm"
                        >
                            <i className="fas fa-edit" />
                            Se réinscrire
                        </a>
                        {StopButton}
                    </React.Fragment>
            }
        }

        return (
            <div className="ibox">
                <div className="ibox-title">
                    <h4>
                        {data.activity_ref.activity_type === "child"
                            ? data.activity_ref.label
                            : data.activity_ref.kind}
                    </h4>
                </div>
                <div className="ibox-content text-align-center-sm">
                    <div className="row">
                        <div className="col-sm-2 project-status p-xs">
                            {renderActivityAction(actionLabel)}
                        </div>
                        {this.state.preApplicationActivity.activity_application ? <div className="col-sm-4 p-xs">
                            <p className="project-number">
                                Demande &nbsp;
                                <b>
                                    {(this.props.current_user || {}).is_admin ?
                                        <a href={`/inscriptions/${this.state.preApplicationActivity.activity_application.id}`}>{`#${this.state.preApplicationActivity.activity_application.id}`}</a> :
                                        `#${this.state.preApplicationActivity.activity_application.id}`}
                                </b>
                            </p>
                            <p className="pb-0">
                                {activityState === undefined ?
                                    this.state.preApplicationActivity.activity_application.desired_activities.map(da => da.activity_ref.kind).join(", ") :
                                    this.state.preApplicationActivity.activity_application.desired_activities.map(da => da.activity_ref.label).join(", ")
                                }
                            </p>
                            {activityDetails}
                        </div> : null}
                        <div className="col-sm-6 p-xs">
                            {actionButtons}
                        </div>
                    </div>
                </div>

                <Modal
                    isOpen={this.state.isStopModalOpen}
                    onRequestClose={() => this.closeStopModal()}
                    className="activity-modal"
                    ariaHideApp={false}
                    contentLabel="Arrêt Activité"
                >
                    <h2 className="modal-header">
                        Souhaitez-vous arrêter le cours suivant ?
                    </h2>
                    <div className="content">
                        <p className="activity-name">
                            <strong>
                                {data.activity_ref.activity_type === "child"
                                    ? data.activity_ref.label
                                    : data.activity_ref.kind}
                            </strong>
                        </p>
                        <p className="activity-date">
                            {data.time_interval && _.capitalize(
                                moment(data.time_interval.start).format("dddd")
                            ) || "??"}{" "}
                            |{data.time_interval && moment(data.time_interval.start).format("HH:mm") || "??"}{" "}
                            -{data.time_interval && moment(data.time_interval.end).format("HH:mm") || "??"}
                        </p>
                        <p className="activity-professor-name">
                            {data.teacher.first_name} {data.teacher.last_name}
                        </p>
                        <p className="activity-room">{data.room.label}</p>

                        <div className="form-group">
                            <select
                                className="form-control m-b"
                                value={
                                    isCustomComment
                                        ? StopReasons.OTHER_ID
                                        : this.state.stopReasonValue
                                }
                                onChange={e => this.handleChangeStopReason(e)}>
                                <option disabled value="0">
                                    Choisir une raison
                                </option>
                                {StopReasons.STOP_REASONS.map(optionMapper())}
                            </select>
                            {isCustomComment ? (
                                <input
                                    className="form-control"
                                    onKeyUp={e =>
                                        this.handleChangeStopReasonCustom(e)
                                    }
                                    type="text"
                                    placeholder="Entrez votre raison ici..."
                                />
                            ) : null}
                        </div>

                        {this.isChildPreApplicationActivity() ?
                            <div className="alert alert-warning">
                                <p>Aucune alternative ne peut vous être proposée.</p>
                                <p>Souhaitez-vous arrêter toute activité musicale et quitter l'école ?</p>
                            </div>
                            : null}
                    </div>
                    <button
                        onClick={() => this.closeStopModal()}
                        className="btn btn-white btn-lg"
                    >
                        Retour
                    </button>
                    <button
                        onClick={(action, comment) =>
                            this.handleProcessPreApplicationActivity(
                                "stop",
                                "test comment"
                            )
                        }
                        className="btn btn-primary btn-lg pull-right"
                    >
                        Je confirme
                    </button>
                </Modal>

                {/*<Modal // Carré VIP 2*/}
                {/*    isOpen={this.state.isApplyModalOpen}*/}
                {/*    onRequestClose={() => this.closeApplyModal()}*/}
                {/*    className="activity-modal"*/}
                {/*    ariaHideApp={false}*/}
                {/*    contentLabel="Inscription Activité"*/}
                {/*>*/}
                {/*    <h2 className="modal-header">*/}
                {/*        A quelle activité souhaitez-vous vous inscrire ?*/}
                {/*    </h2>*/}
                {/*    <div className="content">*/}

                {/*        <div className="form-group">*/}
                {/*            <select*/}
                {/*                className="form-control m-b"*/}
                {/*                onChange={e => this.handleSelectActivityRef(e)}*/}
                {/*                defaultValue={0}*/}
                {/*            >*/}
                {/*                <option key={0} disabled value="0">*/}
                {/*                    Choisissez une activité*/}
                {/*                </option>*/}
                {/*                {_.map(this.nextCycles, c => (*/}
                {/*                    <option key={c.to_activity_ref_id} value={c.to_activity_ref_id}>*/}
                {/*                        {c.to.label}*/}
                {/*                    </option>*/}
                {/*                ))}*/}
                {/*            </select>*/}

                {/*        </div>*/}

                {/*    </div>*/}
                {/*    <button*/}
                {/*        onClick={() => this.closeApplyModal()}*/}
                {/*        className="btn btn-white btn-lg"*/}
                {/*    >*/}
                {/*        Retour*/}
                {/*    </button>*/}

                {/*    {!!this.state.selectedNextActivityRef*/}
                {/*        ? <a*/}
                {/*            href={`/inscriptions/new/${user_id}/${this.state.preApplicationActivity.id*/}
                {/*            }/${this.state.selectedNextActivityRef}/${PRE_APPLICATION_ACTIONS.PURSUE_CHILDHOOD}?auth_token=${csrfToken}`}*/}
                {/*            className="btn btn-primary btn-lg pull-right">*/}
                {/*            <i className="fas fa-edit"/>*/}
                {/*            S'inscrire*/}
                {/*        </a>*/}
                {/*        : <button*/}
                {/*            className="btn btn-primary btn-lg pull-right"*/}
                {/*            disabled={!this.state.selectedNextActivityRef}>*/}
                {/*            <i className="fas fa-edit"/>*/}
                {/*            S'inscrire*/}
                {/*        </button>*/}
                {/*    }*/}
                {/*</Modal>*/}

                <Modal
                    isOpen={this.state.isAssignationRefusedModalOpen}
                    onRequestClose={() => this.closeAssignationRefusedModal()}
                    className="activity-modal"
                    ariaHideApp={false}
                    contentLabel="Inscription Activité"
                >
                    <h2 className="modal-header">
                        Refus de l'activité
                    </h2>
                    <div className="content">
                        <div className="form-group">
                            <textarea name="reason" rows="4" cols="50"
                                      className={"form-control"}
                                      placeholder={"Pouvez vous nous indiquer les raisons de ce refus ?"}
                                      onChange={this.updateReasonRefused}
                            />
                        </div>
                    </div>
                    <button
                        onClick={() => this.closeAssignationRefusedModal()}
                        className="btn btn-white"
                    >
                        Retour
                    </button>
                    <button
                        onClick={() =>
                            this.handleProcessRefusedAssignationActivity()
                        }
                        className="btn btn-primary pull-right"
                    >
                        Je confirme
                    </button>
                </Modal>

                <Modal
                    isOpen={this.state.isAssignationAcceptedModalOpen}
                    onRequestClose={() => this.closeAssignationAcceptedModal()}
                    className="modal-sm"
                    ariaHideApp={false}
                    contentLabel="Inscription Activité"
                >
                    <h2 className="modal-header">
                        Êtes vous sûr d'accepter la proposition ?
                    </h2>
                    <div className="content">
                        <div className="form-group">
                            { this.props.confirm_activity_text ?
                                <p className="mt-5 text-justify">{this.props.confirm_activity_text}</p> : ""
                            }
                        </div>
                    </div>
                    <button
                        onClick={() => this.closeAssignationAcceptedModal()}
                        className="btn btn-white"
                    >
                        Retour
                    </button>
                    <button
                        onClick={() =>
                            this.handleProcessAcceptedAssignationActivity()
                        }
                        className="btn btn-primary pull-right"
                    >
                        Je confirme
                    </button>
                </Modal>
            </div>
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

// function OtherActivityItem({pre_application, season}) {
//     let strting_activities = (pre_application.pre_application_activities || [])
//         .map(pa => `${_.get(pa, "activity.activity_ref.label")} (${displayDateForSeason(pa, season)})`).join(" - ");

//     if (strting_activities.length === 0) {
//         strting_activities = (pre_application.pre_application_desired_activities || [])
//             .map(pa => `${_.get(pa, "desired_activity.activity_ref.label")} (X))`).join(" - ");
//     }

//     return <div className="ibox">
//         <div className="ibox-content text-align-center-sm">
//             <div className="row">
//                 <div className="col-sm-6 p-xs">
//                     <h5 className="text-dark">{pre_application.user.full_name}</h5>
//                     <span>{strting_activities}</span>
//                 </div>

//                 <div className={"col-sm-6 p-xs pt-sm-4 text-rigth"}>
//                     <a href={`/new_application/${pre_application.user.id}`}
//                        className={"btn btn-primary btn-sm"}>Gérer son inscription</a>
//                 </div>
//             </div>
//         </div>
//     </div>
// }

function OtherActivityItem({ user, season }) {
    let strting_activities = (_.get(user, "pre_application.pre_application_activities") || [])
        .map(pa => `${_.get(pa, "activity.activity_ref.label")} (${displayDateForSeason(pa, season)})`).join(" - ");

    if (strting_activities.length === 0) {
        strting_activities = (_.get(user, "pre_application.pre_application_desired_activities") || [])
            .map(pa => `${_.get(pa, "desired_activity.activity_ref.label")} (X))`).join(" - ");
    }

    return <div className="ibox">
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
}
export default PreApplication;