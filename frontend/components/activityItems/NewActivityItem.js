import React, {Fragment} from "react";
import _ from "lodash";
import moment from "moment/moment";
import renderActivityAction from "./renderActivityAction";
import * as ActivityApplicationStatus from "../utils/ActivityApplicationsStatuses";
import {csrfToken} from "../utils";
import swal from "sweetalert2";
import Modal from "react-modal";
import AnswerProposal from "./AnswerProposal";
import CancelApplication from "./CancelApplication";
import EditApplication from "./EditApplication";
import * as api from "../../tools/api";

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
            activityApplicationId: this.props.new_activity_application.id || this.props.new_activity_application.desired_activities[0].activity_application_id
        }
        this.updateReasonRefused = this.updateReasonRefused.bind(this);
        this.handleProcessModifyApplication = this.handleProcessModifyApplication.bind(this);
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
            data
        } = this.props;

        const activity_application_status_id = _.get(this.props, "new_activity_application.activity_application_status_id");

        let actionLabel = "";
        if (this.props.new_activity_application &&
            this.props.new_activity_application.activity_application_status &&
            _.includes(
                ["Cours attribué", "Cours en attente", "Proposition acceptée", "Proposition refusée", "Cours proposé", "En cours de traitement"],
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

            if (this.props.new_activity_application.activity_application_status.label === "En cours de traitement")
                actionLabel = "En cours de traitement";
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
                    {moment(data.time_interval.end).format('HH:mm')}
                </p>
            </React.Fragment>;
        }

        let activityApplicationId = this.state.activityApplicationId.toString();
        let paddedActivityApplicationId = activityApplicationId.padStart(3, '0');

        const dayLabel = data ? moment(data.time_interval.start).format('dddd') : undefined;

        return (
            <React.Fragment>
                <div className="card p-4 pt-0 col-md-12 col-lg-6 mr-4 mb-4 text-dark"
                     style={{border: "none", borderRadius: "12px", color: "#00283B"}}>
                    <div className={`d-inline-flex align-items-top pt-0 row ${data && "pb-sm-0"}`}>
                        <div className="col-sm-6">
                            {(this.props.current_user || {}).is_admin ? <a href={`/inscriptions/${this.state.activityApplicationId}`}>{`#${paddedActivityApplicationId}`}</a> : null}
                            <h3 className="font-weight-bold">{desiredActivity.activity_ref.label}</h3>
                            {
                                data && <div>
                                    <p style={{color: "#00283B"}}>
                                        {dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)} de&nbsp;
                                        {moment(data.time_interval.start).format('HH:mm')} à&nbsp;
                                        {moment(data.time_interval.end).format('HH:mm')}
                                        {data.room && data.room.label && <Fragment>, en salle : {data.room.label}</Fragment>}
                                    </p>
                                    <p style={{color: "#8AA4B1"}}>Avec {data.teacher.first_name} {data.teacher.last_name}</p>
                                </div>
                            }
                        </div>

                        <div className="col-sm-6 text-right">
                            {renderActivityAction(actionLabel)}
                        </div>
                    </div>


                    <div className="col-sm-12 d-inline-flex justify-content-between p-0">
                        <div>
                            <AnswerProposal
                                activity_application_status_id={activity_application_status_id}
                                proposalAnswered={this.state.proposalAnswered}
                                openAssignationRefusedModal={() => this.openAssignationRefusedModal()}
                                openAssignationAcceptedModal={() => this.openAssignationAcceptedModal()}
                            />
                        </div>


                        {activity_application_status_id === this.props.default_activity_status_id && (
                            <div>
                                <CancelApplication
                                    activityApplicationId={this.state.activityApplicationId}
                                />

                                <EditApplication
                                    handleProcessModifyApplication={this.handleProcessModifyApplication.bind(this)}
                                />
                            </div>
                        )}
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

export default NewActivityItem;
