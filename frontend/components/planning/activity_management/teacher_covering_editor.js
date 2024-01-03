import React from "react";
import _ from "lodash";
import Select from "react-select";

const coveringEditorSelectStyles = {
    option: (styles, {data}) => {
        return {
            ...styles,
            color: data.canCover ? "forestgreen" : "#c2c2c2",
        };
    },
};

export default function TeacherCoveringEditor({
    teacher,
    coverTeacherId,
    areHoursCounted,
    potentialCoveringTeachers,
    teachers,
    onChange,
}) {
    const teachersOptions = [
        {
            label: "PAS DE REMPLAÇANT",
            value: "",
            canCover: true,
        },
        ..._(teachers)
            .filter(t =>  t.id !== _.get(teacher, "id"))
            .map(t => {
                const canCover = coverTeacherId == t.id || potentialCoveringTeachers && potentialCoveringTeachers.includes(t.id);

                return {
                    label: `${t.last_name} ${t.first_name} ${canCover ? "✓" : "❌"}`,
                    value: t.id,
                    canCover,
                    isDisabled: !canCover,
                };
            })
            .sortBy([
                ({canCover}) => canCover ? 0 : 1, // place available teachers first
                "label", // and subsort by names
            ])
            .value(),
    ]

    const selectedOption = teachersOptions.find(({value}) => value == coverTeacherId);

    return (
        <div>
            <div className="form-group">
                <label>
                    Remplaçant de {_.get(teacher, "first_name")}{" "}
                    {_.get(teacher, "last_name")}
                </label>
                <Select
                    value={selectedOption}
                    options={teachersOptions}
                    placeholder="PAS DE REMPLAÇANT"
                    styles={coveringEditorSelectStyles}
                    onChange={v => onChange("cover_teacher_id", v.value || null)}>
                </Select>
            </div>

            {coverTeacherId ? (
                <div className="form-group">
                    <label className="m-r">
                        Heures comptées pour le professeur absent ?
                    </label>
                    <div className="flex">
                        <div className="flex flex-end-aligned m-r">
                            <input
                                type="radio"
                                name="are_hours_counted"
                                checked={areHoursCounted}
                                onChange={({ target: { checked, name } }) =>
                                    onChange(name, true)
                                }/>
                            Oui
                        </div>
                        <div className="flex flex-end-aligned">
                            <input
                                type="radio"
                                name="are_hours_counted"
                                checked={!areHoursCounted}
                                onChange={({ target: { checked, name } }) =>
                                    onChange(name, false)
                                }/>
                            Non
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};