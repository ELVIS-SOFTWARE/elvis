import React from "react";
import moment from "moment";
import _ from "lodash";
import { toast } from "react-toastify";
import { csrfToken } from "./utils";
import 'bootstrap'

function globalAttendanceValue(attendances)
{
    if(attendances.length > 0)
    {
        if(attendances.reduce((acc, a) => acc && a.attended === 1, true))
            return 1;
        else if(attendances.reduce((acc, a) => acc && a.attended === 0, true))
            return 0;
        else if(attendances.reduce((acc, a) => acc && a.attended === 2, true))
            return 2;
        else if(attendances.reduce((acc, a) => acc && a.attended === 3, true))
            return 3
    }

    return null;
}

export default class PresenceSheet extends React.Component {
    constructor(props) {
        super(props);

        const hydratedInstances = [...props.instances];

        hydratedInstances.forEach(i => {
            i.student_attendances.forEach(
                sa => sa.user = (sa.is_option ?
                        _.get(
                            _.find(
                                _.get(i, "activity.options"),
                                o => _.get(o, "user.id") === sa.user_id
                            ),
                            "user"
                        ) :
                        i.activity &&
                            i.activity.users &&
                            i.activity.users.find(u => u.id === sa.user_id)
                ),
            );
        });

        const indexedInstances = hydratedInstances.reduce((i, e) => {
            return { ...i, [e.id]: e };
        }, {});

        this.state = {
            instances: indexedInstances,
        };
    }

    handleUpdateAttendance(instanceId, attendanceId, attended) {
        console.log("send:" + attended )
        fetch(`/student_attendances/${attendanceId}`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                student_attendance: {
                    attended,
                },
            }),
        })
            .then(res => {
                if (res.ok) {
                    const instance = {
                        ...this.state.instances[instanceId],
                    };

                    if (instance && instance.student_attendances) {
                        const attendance = instance.student_attendances.find(
                            a => a.id === attendanceId,
                        );

                        if (attendance) attendance.attended = attended;

                        this.setState({
                            instances: {
                                ...this.state.instances,
                                [instanceId]: instance,
                            },
                        });
                    }
                }
            })
            .catch(e =>
                toast.error("Erreur lors de la mise à jour de cette présence"),
            );
    }

    bulkUpdatePromise(targets, attended) {
        const student_attendances = targets.reduce((acc, id) => ({
            ...acc,
            [id]: attended,
        }), {});

        return fetch(`/student_attendances/bulk`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                student_attendances,
            }),
        });
    }

    handleBulkUpdateAttendances(instanceId, targets, attended) {
        this.bulkUpdatePromise(targets, attended)
            .then(res => res.json())
            .then(res => {
                const instance = {
                    ...this.state.instances[instanceId],
                };

                instance.student_attendances.forEach(sa => {
                    const newAttended = res.attendances.find(
                        a => a.id === sa.id,
                    );

                    if (newAttended) sa.attended = newAttended.attended;
                });

                this.setState({
                    instances: {
                        ...this.state.instances,
                        [instanceId]: instance,
                    },
                });
            })
            .catch(e => toast.error("Erreur lors de la mise à jour en masse"));
    }

    handleUpdateAllAttendances(targets, attended) {
        this
            .bulkUpdatePromise(targets, attended)
            .then(res => {
                if(res.ok)
                    this.setState({
                        instances: Object.values(this.state.instances)
                            .map(
                                i => ({
                                    ...i,
                                    student_attendances: i
                                        .student_attendances
                                        .map(sa => ({
                                            ...sa,
                                            attended,
                                        })),
                                }))
                            .reduce((acc, i) => ({...acc, [i.id]: i,}), {}),
                    })
            })
            .catch(e => toast.error("Erreur lors de la mise à jour en masse"));
    }

    render() {
        const { instances } = this.state;
        const instanceKeys = Object.keys(instances);

        if (instanceKeys.length === 0) {
            return (
                <div className="wrapper wrapper-content">
                    <div className="row">
                        <div className="col-lg-6 col-md-10 col-xs-12">
                            <div className="ibox">
                                <div className="ibox-title">
                                    <h4>
                                        <b>
                                            Aucun cours
                                        </b>
                                    </h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }

        const showAllCoursesBanner = instanceKeys.length > 1;

        const orderedInstances = _.orderBy(this.state.instances, i => {
            const start = moment(i.time_interval.start);
            return start.hour() * 100 + start.minute();
        });

        const allAttendances = Object
            .values(this.state.instances)
            .reduce(
                (acc, i) => [...acc, ...i.student_attendances],
                [],
            );

        return (
            <div className="wrapper wrapper-content">
                <div className="row">
                    <div className="col-lg-6 col-md-10 col-xs-12">
                        <div className="ibox">

                            {showAllCoursesBanner && (
                            <div className="ibox-title">
                                <div className="flex flex-center-aligned">
                                    <div className="col-lg-2 col-md-2 col-xs-3 color-black">
                                        Tous les cours
                                    </div>
                                    <div className="col-lg-10 col-md-10 col-xs-9">
                                        <AttendanceControl
                                            value={globalAttendanceValue(allAttendances)}
                                            handleUpdate={val => this.handleUpdateAllAttendances(allAttendances.map(sa => sa.id), val)} />
                                    </div>
                                </div>
                            </div>
                            )}

                        </div>
                        {orderedInstances.map(i => (
                            <React.Fragment key={i.id}>
                                <div className="ibox">
                                    <div className="ibox-title">
                                        <h4>
                                            <b>
                                                {durationString(
                                                    i.time_interval,
                                                )}
                                            </b>{" "}
                                            | {i.activity.activity_ref.label}
                                            <br />
                                            <small>
                                                Salle {i.room && i.room.label}
                                            </small>
                                        </h4>
                                    </div>
                                    <div className="ibox-content no-padding">
                                        <div className="container">
                                            <div className="row">
                                                <div className="col-lg-2 col-md-2 col-xs-3 color-black">
                                                    Tous les élèves
                                                </div>
                                                <div className="col-lg-10 col-md-10 col-xs-9">
                                                    <AttendanceControl
                                                        value={globalAttendanceValue(i.student_attendances)}
                                                        handleUpdate={val => this.handleBulkUpdateAttendances(i.id, i.student_attendances.map(sa => sa.id), val)} />
                                                </div>

                                                <hr />
                                            </div>

                                            {
                                                i
                                                    .student_attendances
                                                    .map(sa => <AttendanceState
                                                            key={sa.user_id}
                                                            attendance={sa}
                                                            interval={i}
                                                            handleUpdate={val => this.handleUpdateAttendance(i.id, sa.id, val)} />
                                                    )
                                            }
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
}

const AttendanceState = ({attendance, handleUpdate}) => <div className="row" style={attendance.is_option ? {color: "#9575CD"} : {}}>
    {
        <div className="col-lg-2 col-md-2 col-xs-3">
            <a
                href={
                    "/users/" +
                    attendance.user_id
                }
                className="m-r-sm"
                style={attendance.is_option ? {color: "#9575CD"} : {}}>
                {attendance.user
                    ? `${
                        attendance
                            .user
                            .first_name
                    } ${
                        attendance
                            .user
                            .last_name
                    }`
                    : "?"}
            </a>
        </div>
    }
    <div className="col-lg-10 col-md-10 col-xs-9 ">
        <AttendanceControl
            value={attendance.attended}
            handleUpdate={handleUpdate}
            sex={(attendance.user || {}).sex}/>
    </div>
</div>;

export const AttendanceControl = ({value, handleUpdate, sex}) => <div className="presence-buttons" style={{color: "initial"}}>
    <button
        className={`m-r-sm ${value == 0 ? "bg-danger" : ""}`}
        style={{borderRadius: "5px", width: "40px", height: "30px"}}
        onClick={() => handleUpdate(0)}
        title={`Absent${sex === 'F' ? "e" : ""}`}>A</button>

    <button className="m-r-sm"
            style={{borderRadius: "5px", width: "40px", height: "30px", backgroundColor: (value == 3 ? "#ff6802" : "")}}
            onClick={() => handleUpdate(3)}
            title="Absence justifiée">J</button>

    <button className={(value == 1 ? "bg-green" : "")}
            style={{borderRadius: "5px", width: "40px", height: "30px"}}
            onClick={() => handleUpdate(1)}
            title={`Présent${sex === 'F' ? "e" : ""}`}>P</button>
</div>;

//turns a time interval into a string representing it's hours extremities.
function durationString(interval) {
    const start = new Date(interval.start),
        end = new Date(interval.end);
    return `${moment(start).format("HH:mm")} ➝ ${moment(end).format("HH:mm")}`;
}
