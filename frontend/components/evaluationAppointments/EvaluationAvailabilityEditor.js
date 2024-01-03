import React, { useState } from "react";
import { Form, Field } from "react-final-form";

import moment from "moment";
moment.locale("fr");

import { optionMapper } from "../utils";
import { required, ordCheck, composeValidators } from "../../tools/validators";
import { MESSAGES } from "../../tools/constants";

export default function EvaluationAvailabilityEditor({
    // Subject props
    availability,
    // Datasets
    activityRefs,
    rooms,
    // Handlers
    onSubmit,
}) {
    const { evaluation_appointments: appointments } = availability;

    const initialValues = {
        start: moment(availability.start).format("HH:mm"),
        end: moment(availability.end).format("HH:mm"),
        activity_ref_id: null,
        room_id: null,
    };

    const intervalIntegrity = vals => vals.start >= vals.end ? "err_interval_integrity" : "";

    const intervalOverlap = vals => {
        const [startH, startM] = vals.start.split(":").map(p => parseInt(p));
        const [endH, endM] = vals.end.split(":").map(p => parseInt(p));

        const int = {
            start: moment(availability.start).hour(startH).minute(startM).valueOf(),
            end: moment(availability.end).hour(endH).minute(endM).valueOf(),
        };

        return availability
            .evaluation_appointments
            .find(ea => {
                const oint = {
                    start: moment(ea.time_interval.start).valueOf(),
                    end: moment(ea.time_interval.end).valueOf(),
                };

                // overlap condition
                return int.start < oint.end && oint.start < int.end;
            });
    };

    const WithError = ({ touched, error, children }) => <div>
        {children}
        {touched && error && <p className="text-danger">{error.startsWith("err_") ? MESSAGES[error] : error}</p>}
    </div>;

    const handleSubmit = values => {
        const [startH, startM] = values.start.split(":").map(p => parseInt(p));
        const [endH, endM] = values.end.split(":").map(p => parseInt(p));

        onSubmit({
            ...values,
            start: moment(availability.start).hour(startH).minute(startM).toISOString(),
            end: moment(availability.end).hour(endH).minute(endM).toISOString(),
            teacher_id: availability.teacher.id,
        });
    };

    const validateForm = values => {
        if(!values.start || !values.end)
            return;
        
        const res = {};

        const intervalErr = intervalIntegrity(values);
        intervalErr && (res.interval = intervalErr);

        const overlap = !intervalErr && intervalOverlap(values);
        overlap && (res.overlap = overlap);

        return res;
    };

    return <Form
        validate={validateForm}
        initialValues={initialValues}
        onSubmit={handleSubmit}>
        {({
            errors,
            touched,
            hasValidationErrors,
            initialValues,
            values,
            handleSubmit,
        }) => {
            const touchedInterval = touched.start || touched.end;

            const filteredRooms = values.activity_ref_id ?
                rooms.filter(r => r.activity_refs.find(ar => ar.id === parseInt(values.activity_ref_id)))
                : [];

            return <div style={{ padding: "15px 10px", border: "solid 1px #e7eaec", borderTopWidth: "0" }}>
                <h3>Rendez-vous validés</h3>
                {
                    appointments.length > 0 ?
                        <AppointmentsList
                            highlightId={touchedInterval && _.get(errors.overlap, "id")}
                            appointments={availability.evaluation_appointments} /> :
                        <p style={{ textAlign: "center" }}>
                            Aucun rendez-vous validé pour le moment.
                        </p>
                }
                <hr />
                <div className="m-t">
                    <h3>Nouveau rendez-vous</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-sm-6 form-group">
                                <label>Début</label>
                                <Field
                                    validate={composeValidators(required, ordCheck(initialValues.start, "gte"))}
                                    type="time"
                                    name="start">
                                    {props => <WithError {...props.meta}>
                                        <input
                                            {...props.input}
                                            min={initialValues.start}
                                            className="form-control" />
                                    </WithError>}
                                </Field>
                            </div>
                            <div className="col-sm-6 form-group">
                                <label>Fin</label>
                                <Field
                                    validate={composeValidators(required, ordCheck(initialValues.start, "gte"))}
                                    type="time"
                                    name="end">
                                    {props => <WithError {...props.meta}>
                                        <input
                                            {...props.input}
                                            max={initialValues.end}
                                            className="form-control" />
                                    </WithError>}
                                </Field>
                            </div>
                        </div>
                        {touchedInterval && errors.overlap && <p className="text-danger"  style={{ textAlign: "center" }}>Un créneau existe déjà sur ces horaires ({moment(errors.overlap.time_interval.start).format("HH:mm")} - {moment(errors.overlap.time_interval.end).format("HH:mm")})</p>}
                        {touchedInterval && errors.interval && <p className="text-danger" style={{ textAlign: "center" }}>{MESSAGES[errors.interval]}</p>}
                        <div className="row">
                            <div className="col-sm-6 form-group">
                                <label>Activité</label>
                                <Field
                                    validate={required}
                                    name="activity_ref_id">
                                    {props => <WithError {...props.meta}>
                                        <select
                                            {...props.input}
                                            className="form-control">
                                            <option value="" disabled selected>Sélectionnez une activité</option>
                                            {activityRefs.map(optionMapper())}
                                        </select>
                                    </WithError>}
                                </Field>
                            </div>
                            <div className="col-sm-6 form-group">
                                <label>Salle</label>
                                <Field
                                    validate={required}
                                    name="room_id">
                                    {props => <WithError {...props.meta}>
                                        <select
                                            disabled={!values.activity_ref_id}
                                            {...props.input}
                                            className="form-control">
                                            <option value="" disabled selected>Sélectionnez une salle</option>
                                            {filteredRooms.map(optionMapper())}
                                        </select>
                                    </WithError>}
                                </Field>
                            </div>
                        </div>

                        <div className="flex flex-end-justified">
                            <button
                                disabled={hasValidationErrors}
                                type="submit"
                                className="btn btn-primary">
                                <i className="fas fa-check"></i> Valider
                        </button>
                        </div>
                    </form>
                </div>
            </div>;
        }}
    </Form>;
}

function AppointmentsList({ appointments, highlightId }) {
    const hightlightStyles = {
        background: "#d94142",
        color: "white",
        fontWeight: "bold",
    };

    return <table className="table table-bordered">
        <thead>
            <tr>
                <th>Horaires</th>
                <th>Activité</th>
                <th>Salle</th>
                <th>Élève</th>
            </tr>
        </thead>
        <tbody>
            {
                appointments.map(a => {
                    const { start, end } = a.time_interval;

                    return <tr key={a.id} style={a.id === highlightId ? hightlightStyles : {}}>
                        <td>{moment(start).format("DD MMM YYYY, HH:mm - ") + moment(end).format("HH:mm")}</td>
                        <td>{a.activity_ref.label}</td>
                        <td>{a.room.label}</td>
                        <td>{a.student ? `${a.student.first_name} ${a.student.last_name}` : "Aucun"}</td>
                    </tr>;
                })
            }
        </tbody>
    </table>
}