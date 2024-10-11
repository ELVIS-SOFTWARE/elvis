import React, {Component, Fragment} from "react";

import moment from "moment";
import {set} from "../../tools/api";
import EvaluationAvailabilityEditor from "./EvaluationAvailabilityEditor";
import ti from "tui-calendar";

moment.locale("fr");


export default class EvaluationAppointmentsManager extends Component {
    constructor(props) {
        super(props);

        this.state = {
            evaluationAvailabilities: [...this.props.evaluation_availabilities],
            editorsVisibility: {},
        };
    }

    toggleEditorVisibility(id) {
        const {editorsVisibility} = this.state;

        this.setState({
            editorsVisibility: {
                ...editorsVisibility,
                [id]: !editorsVisibility[id],
            },
        });
    }

    submitAppointment(timeIntervalId, body) {
        set()
            .success(appointment => {
                const newEvaluationAvailabilities = [...this.state.evaluationAvailabilities];
                const timeIntervalIndex = newEvaluationAvailabilities.findIndex(ti => ti.id === timeIntervalId);

                if (timeIntervalIndex !== -1) {

                    const newTimeInterval = {...newEvaluationAvailabilities[timeIntervalIndex]};
                    const newEvalationAppointments = [...newTimeInterval.evaluation_appointments];
                    newEvalationAppointments.push(appointment);
                    newTimeInterval.evaluation_appointments = newEvalationAppointments;
                    newEvaluationAvailabilities.splice(timeIntervalIndex, 1, newTimeInterval);
                }

                this.setState({
                    evaluationAvailabilities: newEvaluationAvailabilities,
                });
            })
            .post("/evaluation_appointments", body);
    }

    render() {
        const {
            evaluationAvailabilities,
            editorsVisibility,
        } = this.state;

        const {
            activity_refs: activityRefs,
            rooms,
        } = this.props;

        return <div>
            <div class="row wrapper border-bottom white-bg page-heading">
                <h2>Gestion des évaluations</h2>
            </div>
            {
                evaluationAvailabilities.length > 0 ? (
                    <div className="list-group" style={{background: "white"}}>
                        {

                            editorsVisibility[ti.id] === true && <EvaluationAvailabilityEditor
                                availability={ti}
                                rooms={rooms}
                                activityRefs={activityRefs}
                                onSubmit={body => this.submitAppointment(ti.id, body)}/>
                        }
                        {
                            evaluationAvailabilities
                            .map(ti => <Fragment key={ti.id}>
                            <div
                            key={ti.id}
                            className="list-group-item"
                            style={{userSelect: "none", cursor: "pointer", color: "#d94142"}}
                            onClick={() => this.toggleEditorVisibility(ti.id)}>
                            <div className="flex flex-space-between-justified flex-end-aligned">
                            <h4>{ti.teacher.first_name} {ti.teacher.last_name}, {moment(ti.start).format("DD MMM YYYY, HH:mm - ") + moment(ti.end).format("HH:mm")}</h4>
                            <i className={`fas fa-lg m-r fa-angle-${editorsVisibility[ti.id] === true ? "down" : "left"}`}/>
                            </div>
                            </div>
                            <div className={`collapse ${editorsVisibility[ti.id] ? "show" : ""}`}>
                        {
                            editorsVisibility[ti.id] === true && <EvaluationAvailabilityEditor
                            availability={ti}
                            rooms={rooms}
                            activityRefs={activityRefs}
                            onSubmit={body => this.submitAppointment(ti.id, body)}/>
                        }
                            </div>
                            </Fragment>)
                        }
                    </div>
                ) : (
                    <p class="m-lg">Pour le moment, aucun professeur n'a mis de disponibilité pour des évaluations</p>
                )
            }
        </div>
    }
}

