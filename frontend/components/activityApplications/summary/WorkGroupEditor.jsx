import React, { Component } from "react";
import moment from "moment";

import UserWithInfos from "../../common/UserWithInfos";

import { set } from "../../../tools/api";
import { optionMapper, ISO_DATE_FORMAT } from "../../utils";
import _ from "lodash";

function WorkGroupRow({
    activitiesInstrument,
    instruments,
    desiredActivity,
    activity,
    userId,
    onUpdate,
    onDelete,
    onAddOption,
    onRemoveOption,
    onValidate,
    onInvalidate,
}) {
    const { user } = activitiesInstrument;

    const disabledDeletion = activitiesInstrument.user_id !== null;

    const isAssigned = activitiesInstrument.is_validated;
    const isOption = !isAssigned && activitiesInstrument.user_id !== null;

    const isDesiredValidatedOnOtherActivity = Boolean(desiredActivity.activity_id) && desiredActivity.activity_id !== activity.id;

    let studentCellStyle = {};

    if (isAssigned) {
        studentCellStyle = {
            color: "#d63031",
            fontWeight: "bold",
        };
    }
    else if (isOption) {
        studentCellStyle = {
            color: "rgb(149, 117, 205)",
            fontWeight: "bold",
        };
    }

    return <tr key={activitiesInstrument.id}>
        <td>
            {user ?
                <UserWithInfos userId={user.id}>
                    <p style={studentCellStyle}>
                        {`${user.first_name} ${user.last_name}`}&nbsp;<i className="fas fa-info-circle"/>
                    </p>
                </UserWithInfos>
                : "À assigner"}
        </td>
        <td>
            <select
                className="form-control"
                onChange={e => onUpdate({ ...activitiesInstrument, instrument_id: parseInt(e.target.value) })}
                value={activitiesInstrument.instrument_id || ""}>
                <option disabled value="">INSTRUMENT</option>
                {instruments.map(optionMapper())}
            </select>
        </td>
        <td>
            {
                (activitiesInstrument.attempt_date || isOption) &&
                    <input
                        type="date"
                        className="form-control"
                        onChange={e => onUpdate({ ...activitiesInstrument, attempt_date: e.target.value || null })}
                        value={activitiesInstrument.attempt_date ? moment(activitiesInstrument.attempt_date).format(ISO_DATE_FORMAT) : ""} />
            }
        </td>
        <td style={{ width: "250px" }}>
            <div className="flex flex-space-between-justified">
                <button
                    disabled={disabledDeletion}
                    onClick={onDelete}
                    data-tippy-content="Supprimer le rôle"
                    className="btn btn-sm btn-primary m-r-sm">
                    <i className="fas fa-minus"/>
                </button>
                {
                    (!Boolean(activitiesInstrument.user_id) || userId === activitiesInstrument.user_id) && 
                    <div>
                        {!isAssigned &&
                            <button
                                onClick={() => isOption ? onRemoveOption() : onAddOption()}
                                className="btn btn-sm m-r-sm"
                                style={{
                                    color: "#FFF",
                                    backgroundColor: "#9575CD",
                                }}>
                                Option
                            </button>
                        }

                        {(isOption || isAssigned) &&
                            <span {
                                    ...(isDesiredValidatedOnOtherActivity ?
                                        {["data-tippy-content"]: "L'élève est déjà inscrit dans un autre atelier"} :
                                        {})
                                }>
                                <button
                                    disabled={ !isAssigned && isDesiredValidatedOnOtherActivity}
                                    onClick={() => isAssigned ? onInvalidate() : onValidate()}
                                    className="btn btn-sm btn-primary">
                                    {isAssigned ?
                                        "Retirer du rôle" :
                                        "Valider"}
                                </button>
                            </span>
                        }
                    </div>
                }
            </div>
        </td>
    </tr>;
}

export default class WorkGroupEditor extends Component {
    constructor(props) {
        super(props);

        this.state = {
            instruments: [],
        };
    }

    componentDidMount() {
        set()
            .success(instruments => this.setState({ instruments }))
            .get(`/instruments.json`);
    }

    updateActivitiesInstrument(activitiesInstrument) {
        const { activity: {
            activities_instruments: activitiesInstruments,
        } } = this.props;

        const newInstruments = [...activitiesInstruments];
        const toUpdateIdx = newInstruments.findIndex(ai => ai.id === activitiesInstrument.id);
        newInstruments.splice(toUpdateIdx, 1, activitiesInstrument);

        this.props.onUpdateActivity({
            ...this.props.activity,
            activities_instruments: newInstruments,
        });
    }

    handleUpdateRole(ai) {
        set()
            .success(this.updateActivitiesInstrument.bind(this))
            .patch(`/activities_instruments/${ai.id}`, {
                activities_instrument: {
                    instrument_id: ai.instrument_id,
                    attempt_date: ai.attempt_date,
                    activity_id: ai.activity_id,
                    user_id: ai.user_id,
                },
            });
    }

    handleCreateRole() {
        const { activity: {
            id,
            activities_instruments: activitiesInstruments,
        } } = this.props;

        set()
            .success(ai => {
                const newInstruments = [...activitiesInstruments, ai];

                this.props.onUpdateActivity({
                    ...this.props.activity,
                    activities_instruments: newInstruments,
                });
            })
            .post(`/activities_instruments`, {
                activities_instrument: {
                    activity_id: id,
                }
            });
    }

    handleDeleteRole(id) {
        const { activity: {
            activities_instruments: activitiesInstruments,
        } } = this.props;

        set()
            .success(() => {
                const newInstruments = [...activitiesInstruments];
                const toRemoveIndex = newInstruments.findIndex(ai => ai.id === id);

                newInstruments.splice(toRemoveIndex, 1);

                this.props.onUpdateActivity({
                    ...this.props.activity,
                    activities_instruments: newInstruments,
                });
            })
            .del(`/activities_instruments/${id}`);
    }

    handleAddOption(aiId) {
        const { desiredActivity } = this.props;

        set()
            .success(this.props.onUpdateActivity)
            .post(`/activities_instruments/${aiId}/option/${desiredActivity.id}`);
    }

    handleRemoveOption(aiId) {
        const { desiredActivity } = this.props;

        set()
            .success(this.props.onUpdateActivity)
            .del(`/activities_instruments/${aiId}/option/${desiredActivity.id}`);
    }

    handleValidate(aiId) {
        const { desiredActivity } = this.props;

        set()
            .success(this.props.onUpdateActivity)
            .post(`/activities_instruments/${aiId}/student/${desiredActivity.id}`);
    }

    handleInvalidate(aiId) {
        const { desiredActivity } = this.props;

        set()
            .success(this.props.onUpdateActivity)
            .del(`/activities_instruments/${aiId}/student/${desiredActivity.id}`);
    }

    render() {
        const { userId, activity, desiredActivity } = this.props;
        const { instruments } = this.state;

        return <div>
            <table className="table table-bordered" style={{margin: "0"}}>
                <thead>
                    <tr>
                        <th>Élève</th>
                        <th>Instrument</th>
                        <th>Essai le</th>
                        <th className="flex flex-space-between-justified">
                            <p>
                                Actions
                            </p>
                            <button
                                onClick={() => this.handleCreateRole()}
                                className="btn btn-xs btn-primary">
                                <i className="fas fa-plus"/> Ajouter rôle
                            </button>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {_(activity.activities_instruments)
                        .map(ai => <WorkGroupRow key={ai.id}
                            userId={userId}
                            activitiesInstrument={ai}
                            activity={activity}
                            desiredActivity={desiredActivity}
                            instruments={instruments}
                            onUpdate={ai => this.handleUpdateRole(ai)}
                            onDelete={() => this.handleDeleteRole(ai.id)}
                            onAddOption={() => this.handleAddOption(ai.id)}
                            onRemoveOption={() => this.handleRemoveOption(ai.id)}
                            onValidate={() => this.handleValidate(ai.id)}
                            onInvalidate={() => this.handleInvalidate(ai.id)} />)
                        .value()}
                </tbody>
            </table>
        </div>
    }
}