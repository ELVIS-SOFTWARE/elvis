import { values } from "lodash";
import moment from "moment";
import React from "react";
import { Form, Field } from "react-final-form";
import * as TimeIntervalHelpers from "../planning/TimeIntervalHelpers.js";
import YearlyCalendar from "../planning/YearlyCalendar.js";
import { ISO_DATE_FORMAT } from "../utils";
import * as api from "../../tools/api.js";
import swal from "sweetalert2";

export default class DeleteCourseModal extends React.Component {
    constructor(props) {
        super(props);

        const detectedSeason = this.props.activity
            ? TimeIntervalHelpers.getSeasonFromDate(
                  this.props.startTime.toDate(),
                  this.props.seasons
              )
            : undefined;

        this.state = {
            selected: undefined,
            season: detectedSeason,
            activity: this.props.activity,
            activityInstances: undefined,
            instanceStatus: undefined
        };
    }

    componentDidMount() {
        api.get(
            `/activity_time_intervals?activity_id=${this.state.activity.id}`
        ).then(({ data, error }) => {
            if (error) {
                console.error(error);
            } else {

                const instanceStatus = {}
                
                data.forEach((instance) => {
                    const date = instance.time_interval.start.split('T')[0]
                    instanceStatus[date] = {activity_instance_id: instance.activity_instance_id, start: moment(instance.time_interval.start), selected:true}
                });

                this.setState({ ...this.state, activityInstances: data, instanceStatus: instanceStatus});
            }
        });
    }

    handlePickDateYearlyCalendar(selectedDay) {
        const instanceStatus = { ...this.state.instanceStatus };
        const key = selectedDay.format(ISO_DATE_FORMAT);

        if (instanceStatus[key]) {
            // It's already an instance, so we remove it
            const instance = { ...instanceStatus[key] };
            instance.selected = !instance.selected;
            instanceStatus[key] = instance;
        }

        this.setState({
            instanceStatus: {
                ...instanceStatus,
            },
        });
    }

    render() {
        const {
            selected,
            season,
            activity,
            instanceStatus,
            activityInstances,
        } = this.state;
        return (
            <Form
                onSubmit={(values) =>
                {
                    const tmpValues = {...values};

                    const instances = Object.values(this.state.instanceStatus).filter(instance => !instance.selected);
                    const instanceIds = instances.map((instance) => instance.activity_instance_id)

                    const today = new Date();

                    if(values.repetition == "all")
                    {
                        const deletableInstances = activityInstances.filter(ai => new Date(ai.time_interval.start) >= today || ai.student_count <= 0);

                        deletableInstances.forEach((instance) => instanceIds.push(instance.activity_instance_id));

                        if(instanceIds.length === 0)
                        {
                            swal.fire({
                                title: "Attention",
                                text: "Aucun cours ne peut être supprimé.",
                                type: "error",
                            });

                            return
                        }

                        tmpValues.repetition = "custom_all";
                    }
                    else
                    {
                        if(instanceIds.length === 0)
                        {
                            swal.fire({
                                title: "Attention",
                                text: "Aucun cours n'a été sélectionné.",
                                type: "error",
                            });

                            return
                        }

                        if(activityInstances
                            .filter(ai =>  instanceIds.includes(ai.activity_instance_id))
                            .filter(ai => new Date(ai.time_interval.start) <= today && ai.student_count >= 0).length > 0)
                        {
                            swal.fire({
                                title: "Attention",
                                text: "Vous ne pouvez pas supprimer un cours qui est déjà passé et qui a des élèves inscrits.",
                                type: "warning",
                            });

                            return
                        }
                    }

                    const timeIntervalIds = this.state.activityInstances
                        .filter((activityInstance) =>  instanceIds.includes(activityInstance.activity_instance_id))
                        .map((activityInstance) => activityInstance.time_interval.id);

                    this.props.onSubmit({
                        ...tmpValues,
                        instanceIds: instanceIds,
                        timeIntervalIds: timeIntervalIds
                    })
                }
                }
                render={({ handleSubmit }) => (
                    <form onSubmit={handleSubmit} className="p-lg">
                        <div className="row">
                            <h3 className="text-center">Supprimer un cours</h3>

                            <div className="row">
                                <p>Souhaitez-vous:</p>
                                <div
                                    className="form-group"
                                    onClick={e => {
                                        this.setState({
                                            selected: e.target.value,
                                        });
                                    }}
                                >
                                    <p>
                                        <Field
                                            name="repetition"
                                            component="input"
                                            type="radio"
                                            value="all"
                                            id={"delete_all"}
                                        />{" "}
                                        <label htmlFor={"delete_all"}> Supprimer toutes les récurrences de ce
                                        cours.</label>
                                    </p>
                                    <p>
                                        <Field
                                            name="repetition"
                                            component="input"
                                            type="radio"
                                            value="select"
                                            id={"delete_select"}
                                        />{" "}
                                        <label htmlFor={"delete_select"}>Sélectionner les récurrences à
                                            supprimer.</label>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            {this.state.selected == "select" && (
                                <YearlyCalendar
                                    season={season}
                                    // activityInstances={() =>
                                    //     this.state.changes.recurrences
                                    // }
                                    existingDates={activityInstances}
                                    activityInstances={instanceStatus}
                                    handlePickDate={(date, classes) =>
                                        this.handlePickDateYearlyCalendar(
                                            date,
                                            classes
                                        )
                                    }
                                    legend={{selected:"Cours existant",unselected:"Cours à supprimer"}}
                                />
                            )}
                        </div>
                        <div className="row">
                            <div className="pull-right">
                                <button
                                    type="reset"
                                    className="btn btn-md m-sm"
                                    onClick={this.props.onClose}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-md"
                                >
                                    Valider
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            />
        );
    }
}
