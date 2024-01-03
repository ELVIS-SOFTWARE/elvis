import React, {Fragment} from "react";
import _ from "lodash";
import {csrfToken, optionMapper} from "../utils";
import * as StopReasons from "../utils/StopReasons";
import {PRE_APPLICATION_ACTIONS} from "../../tools/constants";
import moment from "moment/moment";
import Modal from "react-modal";
import renderActivityAction from "./renderActivityAction";
import * as ActivityApplicationStatus from "../utils/ActivityApplicationsStatuses";

class CurrentActivityItem extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            preApplicationActivity: this.props.pre_application_activity,
            isStopModalOpen: false,
            stopReasonValue: "0",
            stopReasonCustom: "",
            selectedNextActivityRef: this.getDefaultChildNextActivityRef()
        };
    }

    closeStopModal() {
        this.setState({ isStopModalOpen: false });
    }

    openStopModal() {
        this.setState({ isStopModalOpen: true });
    }

    handleChangeStopReason(event) {
        this.setState({stopReasonValue: event.target.value});
    }

    handleChangeStopReasonCustom(event) {
        this.setState({stopReasonCustom: event.target.value});
    }

    isChildPreApplicationActivity() {
        return _.get(this.props, "data.activity_ref.activity_type") === "child"
            || _.get(this.props, "data.activity_ref.kind") === "ENFANCE";
    }

    // Pour les enfants, renvoie les activités suivantes parmi celles qui sont possibles
    // @return un tableau d'activités (ActivityRef)
    getChildActivityNextCycles() {
        return this.props.current_activity_application.desired_activities[0].activity_ref.next_cycles;
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
                        activity_application_id: this.props.current_activity_application.id,
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

                this.setState({preApplicationActivity: newState});
            });
    }

    render() {
        const {
            data,
            pre_application_activity,
            openStopModal,
            user_id,
            authToken,
        } = this.props;


        let isPreapplicationEnabled = false;
        if (this.state.preApplicationActivity !== undefined) {
            isPreapplicationEnabled =
                !this.state.preApplicationActivity.status &&
                this.props.allowPreApplication;
        }

        let actionLabel = "Current";

        let ActivityStatus = _.get(this.props, "current_activity_application.activity_application_status");
        if (ActivityStatus) {
            if ( ActivityStatus.id === ActivityApplicationStatus.STOPPED_ID ||
                ActivityStatus.id === ActivityApplicationStatus.STOPPED ||
                ActivityStatus.id === ActivityApplicationStatus.CANCELED_ID ||
                ActivityStatus.id === ActivityApplicationStatus.CANCELED)
            {

                actionLabel = "Arrêt";
            }
        }

        const isCustomComment = this.state.stopReasonValue === StopReasons.OTHER_ID;
        let actionButtons = "";

        let StopButton =
            <button
                onClick={() => this.openStopModal()}
                className="btn btn-primary m-sm"
            >
                <i className="fas fa-times mr-1"/>
                Arrêter
            </button>

        if (isPreapplicationEnabled) {
            if (this.isChildPreApplicationActivity() && this.state.preApplicationActivity.activity_application === undefined) {
                this.nextCycles = this.getChildActivityNextCycles();

                let nextActivityRefKinds = _.uniqBy(this.nextCycles, "to.activity_ref_kind_id");
                let timeslotActivities = this.nextCycles.filter(a => a.to.allows_timeslot_selection === true);
                nextActivityRefKinds = nextActivityRefKinds.concat(timeslotActivities);
                nextActivityRefKinds = _.uniqBy(nextActivityRefKinds, "id");

                actionButtons =
                    <Fragment>
                        {nextActivityRefKinds.map(activity =>
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
                            <i className="fas fa-edit mr-1" />
                            Se réinscrire
                        </a>
                        {StopButton}
                    </React.Fragment>
            }
        }

        /**
         *  Affichage du jour, créneau, professeur, et salle
         */
        let activityDetails = "";
        let activityState = _.get(this.props, "current_activity_application.desired_activities[0].activity");

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

        return (
            <div className="row">
                <div className="col-sm-9">
                    <div className="ibox animated fadeInRight">
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
                                    <p className="pb-0"> {data.activity_ref.label} </p>
                                    {activityState !== undefined ?
                                        <p className="pb-0"> {activityDetails} </p>
                                        : ""
                                    }
                                </div>

                                <div className="col-sm-6 p-xs">
                                    {actionButtons}
                                </div>
                            </div>
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
                        {data.time_interval !== undefined ?
                            <p className="activity-date">
                            {data.time_interval && _.capitalize(
                                moment(data.time_interval.start).format("dddd")
                            ) || "??"}{" "}
                            |{data.time_interval && moment(data.time_interval.start).format("HH:mm") || "??"}{" "}
                            -{data.time_interval && moment(data.time_interval.end).format("HH:mm") || "??"}
                        </p> : "" }

                        {data.teacher !== undefined ?
                            <p className="activity-professor-name">
                                {data.teacher.first_name} {data.teacher.last_name}
                            </p>
                            : ""
                        }

                        {data.room !== undefined ?
                            <p className="activity-room">{data.room.label}</p>
                            : ""
                        }

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
            </div>
        );
    }
}

export default CurrentActivityItem;
