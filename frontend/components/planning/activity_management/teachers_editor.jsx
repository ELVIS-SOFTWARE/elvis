import React from "react";

export default function TeachersEditor({
    teachers,
    selected,
    onChangeTeacher,
    onToggleIsMainTeacher,
    onAddTeacher,
    onRemoveTeacher,
}) {
    const notSelectedTeachersOptions = teachers
        .filter(t => !selected.map(ta => ta.user_id).includes(t.id))
        .map(t => (
            <option key={t.id} value={t.id}>
                {`${t.first_name} ${t.last_name}`}
            </option>
        ));
    return (
        <div>
            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>Professeur</th>
                        <th>Principal</th>
                        <th>Supprimer</th>
                    </tr>
                </thead>
                <tbody>
                    {selected.map(ta => (
                        <tr key={ta.user_id}>
                            <td>
                                <select
                                    className="form-control"
                                    onChange={e =>
                                        onChangeTeacher(
                                            ta.user_id,
                                            e.target.value
                                        )
                                    }
                                    value={ta.user_id}
                                >
                                    {[
                                        ...notSelectedTeachersOptions,
                                        <option
                                            key={ta.user_id}
                                            value={ta.user_id}
                                        >
                                            {`${
                                                teachers.find(
                                                    t => t.id === ta.user_id
                                                ).first_name
                                            } ${
                                                teachers.find(
                                                    t => t.id === ta.user_id
                                                ).last_name
                                            }`}
                                        </option>,
                                    ]}
                                </select>
                            </td>
                            <td>
                                <input
                                    type="checkbox"
                                    style={{ margin: "auto" }}
                                    checked={ta.is_main}
                                    disabled={
                                        ta.is_main &&
                                        !(
                                            selected.filter(t => t.is_main)
                                                .length > 1
                                        )
                                    }
                                    title={
                                        ta.is_main
                                            ? "Il faut au moins un professeur principal par cours"
                                            : ""
                                    }
                                    onChange={() =>
                                        onToggleIsMainTeacher(ta.user_id)
                                    }
                                />
                            </td>
                            <td>
                                <button
                                    className="btn btn-primary"
                                    disabled={
                                        ta.is_main &&
                                        !(
                                            selected.filter(t => t.is_main)
                                                .length > 1
                                        )
                                    }
                                    title={
                                        ta.is_main
                                            ? "Vous ne pouvez supprimer un professeur principal que s'il y en a un autre"
                                            : ""
                                    }
                                    onClick={() => onRemoveTeacher(ta.user_id)}
                                >
                                    <i className="fas fa-times" />
                                </button>
                            </td>
                        </tr>
                    ))}
                    <tr>
                        <td>
                            <select
                                className="form-control"
                                value=""
                                onChange={e => onAddTeacher(e.target.value)}
                            >
                                <option value="" />
                                {notSelectedTeachersOptions}
                            </select>
                        </td>
                        <td />
                        <td />
                    </tr>
                </tbody>
            </table>
        </div>
    );
};