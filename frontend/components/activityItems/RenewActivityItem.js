import React, {Fragment} from "react";
import _ from "lodash";
import * as ActivityApplicationStatus from "../utils/ActivityApplicationsStatuses";
import {csrfToken} from "../utils";
import swal from "sweetalert2";
import moment from "moment/moment";
import Modal from "react-modal";
import renderActivityAction from "./renderActivityAction";
import AnswerProposal from "./AnswerProposal";
import CancelApplication from "./CancelApplication";
import EditApplication from "./EditApplication";
import * as api from "../../tools/api";

class RenewActivityItem extends React.Component {
    nextCycles = null;

    constructor(props) {
        super(props);

        const activity_application_status_id = _.get(this.props, "pre_application_activity.activity_application.activity_application_status_id");

        this.state = {
            preApplicationActivity: this.props.pre_application_activity,
            isAssignationRefusedModalOpen: false,
            isAssignationAcceptedModalOpen: false,
            reasonOfRefusal: "",
            proposalAnswered: (activity_application_status_id === ActivityApplicationStatus.PROPOSAL_ACCEPTED_ID
                || activity_application_status_id === ActivityApplicationStatus.PROPOSAL_REFUSED_ID)
        };
        this.updateReasonRefused = this.updateReasonRefused.bind(this);
    }

    openAssignationRefusedModal() {
        this.setState({isAssignationRefusedModalOpen: true});
    }

    closeAssignationRefusedModal() {
        this.setState({isAssignationRefusedModalOpen: false});
    }

    openAssignationAcceptedModal() {
        this.setState({isAssignationAcceptedModalOpen: true});
    }

    closeAssignationAcceptedModal() {
        this.setState({isAssignationAcceptedModalOpen: false});
    }

    updateReasonRefused(event) {
        this.setState({reasonOfRefusal: event.target.value});
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
            this.setState({proposalAnswered: json.activity_application_status_id === ActivityApplicationStatus.PROPOSAL_REFUSED_ID});
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
            this.setState({proposalAnswered: json.activity_application_status_id === ActivityApplicationStatus.PROPOSAL_ACCEPTED_ID});
            swal("Réussite", "Proposition acceptée", "success");
        });
    }

    handleProcessModifyApplication(content) {
        api.set()
            .error(() => {
                swal({
                    title: "Erreur lors de l'envoi du commentaire",
                    type: "error",
                });
            })
            .post("/comments", {
                commentable_id: this.state.preApplicationActivity.activity_application_id,
                commentable_type: "ActivityApplication",
                user_id: this.props.current_user.id,
                content: content,
            }, {});
    }

    render() {
        const {
            data,
            pre_application_activity,
            user_id,
            authToken,
        } = this.props;

        let actionLabel = "";
        if (this.state.preApplicationActivity.activity_application &&
            this.state.preApplicationActivity.activity_application.activity_application_status &&
            _.includes(
                ["Cours attribué", "Cours en attente", "Proposition acceptée", "Proposition refusée", "Cours proposé"],
                this.state.preApplicationActivity.activity_application.activity_application_status.label
            )
        ) {
            actionLabel = "Traitée";

            if (this.state.preApplicationActivity.activity_application.activity_application_status.label === "Proposition acceptée")
                actionLabel = "Proposition acceptée";

            if (this.state.preApplicationActivity.activity_application.activity_application_status.label === "Proposition refusée")
                actionLabel = "Proposition refusée";

            if (this.state.preApplicationActivity.activity_application.activity_application_status.label === "Cours proposé")
                actionLabel = "Cours proposé";
        } else {
            actionLabel = "En attente";

            if (this.state.preApplicationActivity.action) {
                if (this.state.preApplicationActivity.action === "stop")
                    actionLabel = "Arrêt";
                else
                    actionLabel = "En traitement";
            }
        }

        /**
         *  Affichage du créneau
         */
        let activityDetails = "";
        let activityState = _.get(this.props, "pre_application_activity.next_activity");

        if (activityState !== undefined && activityState !== null) {
            let dayLabel = moment(activityState.time_interval.start).format('dddd')
            activityDetails = <React.Fragment>
                <p className="pb-0">
                    {dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)} de&nbsp;
                    {moment(activityState.time_interval.start).format('HH:mm')} à&nbsp;
                    {moment(activityState.time_interval.end).format('HH:mm')}
                </p>
            </React.Fragment>;
        }

        let activity_application_status_id = _.get(this.state, "preApplicationActivity.activity_application.activity_application_status_id");

        return (
            <React.Fragment>
                <tr>
                    <td>
                        <b>
                            {(this.props.current_user || {}).is_admin ?
                                <a href={`/inscriptions/${this.state.preApplicationActivity.activity_application.id}`}>{`0${this.state.preApplicationActivity.activity_application.id}`}</a> :
                                `0${this.state.preApplicationActivity.activity_application.id}`}
                        </b>
                    </td>
                    <td className="font-weight-bold" style={{color: "#00283B"}}>
                        {this.props.data.activity_ref.label}
                    </td>
                    <td>
                        {this.props.user.first_name} {this.props.user.last_name}
                    </td>
                    <td>
                        {moment(this.props.pre_application_activity.activity_application.created_at).format("DD/MM/YYYY")}
                    </td>
                    <td>
                        {renderActivityAction(actionLabel)}
                    </td>
                    <td>
                        {activityDetails}
                    </td>
                    <td className="d-flex justify-content-end">
                        <AnswerProposal
                            activity_application_status_id={activity_application_status_id}
                            proposalAnswered={this.state.proposalAnswered}
                            openAssignationRefusedModal={() => this.openAssignationRefusedModal()}
                            openAssignationAcceptedModal={() => this.openAssignationAcceptedModal()}
                        />

                        {activity_application_status_id === this.props.default_activity_status_id &&
                            <Fragment>
                                <CancelApplication
                                    activityApplicationId={this.state.preApplicationActivity.activity_application_id}
                                />

                                <EditApplication
                                    handleProcessModifyApplication={this.handleProcessModifyApplication.bind(this)}
                                />
                            </Fragment>}
                    </td>
                </tr>

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
                            {this.props.confirm_activity_text ?
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

            </React.Fragment>
        );
    }
}

export default RenewActivityItem;
