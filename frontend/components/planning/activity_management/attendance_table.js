import React from "react";
import moment from "moment";

export default function AttendanceTable({
    attendances,
    handleUpdate,
    handleUpdateAll,
}) {
    let bulkValue = null;

    if (
        attendances.reduce((acc, sa) => acc && sa.attended === 1, true) ===
        true
    )
        bulkValue = true;
    else if (
        attendances.reduce((acc, sa) => acc && sa.attended === 0, true) ===
        true
    )
        bulkValue = false;

    let styleOptionalStudents = { color: "#9575CD" };

    return (
        <table className="table">
            <thead>
                <tr>
                    <th>N° Adh</th>
                    <th>Elève</th>
                    <th>
                        Présent
                        <AttendanceControl
                            value={bulkValue}
                            handleUpdate={v =>
                                handleUpdateAll(
                                    attendances.map(a => a.id),
                                    v
                                )} />
                    </th>
                </tr>
            </thead>

            <tbody>
                {_(attendances)
                    .sortBy(a => a.user.last_name.toLowerCase())
                    .map((a, i) => (
                        <tr
                            key={i}
                            style={a.is_option ? styleOptionalStudents : {}}
                        >
                            <td>{a.user.adherent_number}</td>
                            <td>
                                <a
                                    href={`/users/${a.user.id}`}
                                    style={
                                        a.is_option ? styleOptionalStudents : {}
                                    }>
                                    {a.user.last_name}
                                    &nbsp;
                                    {`${a.user.first_name}, ${moment().diff(
                                        a.user.birthday,
                                        "years"
                                    )} ans `}
                                    {/* isEveil(
                                this.props.interval
                                    .activity
                            )
                                ? `(avec ${
                                    _.find(
                                        u
                                            .activity_application
                                            .desired_activities,
                                        desAct =>
                                            desAct.activity_id ==
                                            this.props
                                                .interval
                                                .activity_id
                                    ).user.first_name
                                } ${
                                    _.find(
                                        u
                                            .activity_application
                                            .desired_activities,
                                        desAct =>
                                            desAct.activity_id ==
                                            this.props
                                                .interval
                                                .activity_id
                                    ).user.last_name
                                }) `
                                : null */}
                                </a>
                            </td>
                            {(() => {
                                return (
                                    <td>
                                        <AttendanceControl
                                            value={a.attended}
                                            handleUpdate={v =>
                                                handleUpdate(
                                                    a.id,
                                                    v
                                                )} />
                                    </td>
                                );
                            })()}
                            {/*<td>
                        <div className="flex flex-center-aligned flex-space-around-justified">
                            {this.props.isTeacher ? null : (
                                <i
                                    className="fas fa-user-times pull-right"
                                    style={{
                                        cursor: 'pointer',
                                    }}
                                    onClick={() =>
                                        this.handleRemoveStudent(
                                            u,
                                        )
                                    }
                                />
                            )}
                        </div>
                    </td>*/}
                        </tr>
                    ))
                    .value()}
            </tbody>
        </table>
    );
};

const AttendanceControl = ({ value, handleUpdate }) => (
    <div className="presence-buttons" style={{ color: "initial" }}>
        <label className="presence-button-yes">
            {
                //present radio
            }
            <input
                type="radio"
                checked={value === true}
                onChange={e => handleUpdate(true)}
            />
            <span className="custom-radio">
                <i className="fas fa-check" />
            </span>
        </label>
        <label className="presence-button-no">
            {
                //absent radio
            }
            <input
                type="radio"
                checked={value === false}
                onChange={e => handleUpdate(false)}
            />
            <span className="custom-radio">
                <i className="fas fa-times" />
            </span>
        </label>
    </div>
);