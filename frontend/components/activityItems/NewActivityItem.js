import React from "react";
import _ from "lodash";
import moment from "moment/moment";
import renderActivityAction from "./renderActivityAction";
import * as ActivityApplicationStatus from "../utils/ActivityApplicationsStatuses";
import {csrfToken} from "../utils";
import swal from "sweetalert2";
import Modal from "react-modal";
import AnswerProposal from "./AnswerProposal";

class NewActivityItem extends React.Component {
    constructor(props) {
        super(props);

        const activity_application_status_id = _.get(this.props, "new_activity_application.activity_application_status_id");

        this.state = {
            preApplicationActivity: this.props.new_activity_application,
            isAssignationRefusedModalOpen: false,
            isAssignationAcceptedModalOpen: false,
            reasonOfRefusal: "",
            proposalAnswered: (activity_application_status_id === ActivityApplicationStatus.PROPOSAL_ACCEPTED_ID
                || activity_application_status_id === ActivityApplicationStatus.PROPOSAL_REFUSED_ID),
            activityApplicationId: this.props.new_activity_application.desired_activities[0].activity_application_id
        }
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
            `/inscriptions/${this.state.activityApplicationId}`,
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
                    id: this.props.new_activity_application.activity_application_id,
                    activity_application: this.props.new_activity_application.activity_application,
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
            `/inscriptions/${this.state.activityApplicationId}`,
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
                    id: this.props.new_activity_application.activity_application_id,
                    activity_application: this.props.new_activity_application.activity_application
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
            data
        } = this.props;

        const activity_application_status_id = _.get(this.props, "new_activity_application.activity_application_status_id");

        let actionLabel = "";
        if (this.props.new_activity_application &&
            this.props.new_activity_application.activity_application_status  &&
            _.includes(
                ["Cours attribué", "Cours en attente", "Proposition acceptée", "Proposition refusée", "Cours proposé"],
                this.props.new_activity_application.activity_application_status.label
            )
        ) {
            actionLabel = "Traitée";
            if (this.props.new_activity_application.activity_application_status.label === "Proposition acceptée")
                actionLabel = "Proposition acceptée";

            if (this.props.new_activity_application.activity_application_status.label === "Proposition refusée")
                actionLabel = "Proposition refusée";

            if (this.props.new_activity_application.activity_application_status.label === "Cours proposé")
                actionLabel = "Cours proposé";
        } else {
            actionLabel = "En attente";
        }

        /**
         *  Affichage du jour, créneau, professeur, et salle
         */

        let desiredActivity = _.get(this.props, "new_activity_application.desired_activities[0]");

        let activityDetails = "";
        if (data !== undefined && data !== null) {
            let dayLabel = moment(data.time_interval.start).format('dddd')
            activityDetails = <React.Fragment>
                <p className="pb-0">
                    {dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)} de&nbsp;
                    {moment(data.time_interval.start).format('HH:mm')} à&nbsp;
                    {moment(data.time_interval.end).format('HH:mm')} avec&nbsp;
                    {data.teacher.first_name}
                    &nbsp;{data.teacher.last_name},
                    en salle : {data.room.label}
                </p>
            </React.Fragment>;
        }

        return (
            <div className="row">
                <div className="col-sm-9">
                    <div className="ibox animated fadeInRight">
                        <div className="ibox-title">
                            <h4>
                                {desiredActivity.activity_ref.activity_type === "child"
                                    ? desiredActivity.activity_ref.label
                                    : desiredActivity.activity_ref.kind}
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
                                                <a href={`/inscriptions/${this.state.activityApplicationId}`}>{`#${this.state.activityApplicationId}`}</a> :
                                                `#${this.state.activityApplicationId}`}
                                        </b>
                                    </p>
                                    <p className="pb-0"> {desiredActivity.activity_id === null ? desiredActivity.activity_ref.kind : desiredActivity.activity_ref.label} </p>
                                    <p className="pb-0"> {activityDetails} </p>
                                </div>
                                <div className="col-sm-6 p-xs">
                                    <AnswerProposal
                                        activity_application_status_id={activity_application_status_id}
                                        proposalAnswered={this.state.proposalAnswered}
                                        openAssignationRefusedModal={() => this.openAssignationRefusedModal()}
                                        openAssignationAcceptedModal={() => this.openAssignationAcceptedModal()}
                                    />
                                </div>
                            </div>
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

export default NewActivityItem;
