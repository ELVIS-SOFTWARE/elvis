import * as ActivityApplicationStatus from "../utils/ActivityApplicationsStatuses";
import React from "react";
function AnswerProposal(props) {
    let activity_application_status_id = props.activity_application_status_id;
    let proposalAnswered = props.proposalAnswered;

    if (activity_application_status_id === ActivityApplicationStatus.ACTIVITY_PROPOSED_ID ||
        (activity_application_status_id === ActivityApplicationStatus.PROPOSAL_ACCEPTED_ID ||
            activity_application_status_id === ActivityApplicationStatus.PROPOSAL_REFUSED_ID)
                && !proposalAnswered)
    {
            return (
                <React.Fragment>
                    <button
                        onClick={() => props.openAssignationRefusedModal()}
                        className="btn btn-danger btn-sm m-xs font-weight-bold"
                        style={{borderRadius: "8px"}}
                        disabled={proposalAnswered}
                    >
                        <i className="fas fa-times mr-2"/>
                        Je refuse
                    </button>
                    <button
                        onClick={() => props.openAssignationAcceptedModal()}
                        className="btn btn-primary btn-sm m-xs font-weight-bold"
                        style={{borderRadius: "8px"}}
                        disabled={proposalAnswered}
                    >
                        <i className="fas fa-check mr-2"/>
                        Je valide
                    </button>
                </React.Fragment>
            )
    } else {
        return null;
    }
}

export default AnswerProposal;