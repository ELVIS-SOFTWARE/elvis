import React from "react";
import _ from "lodash";

const SupplementaryPreferences = ({
    teachers,
    selectedTeachers,
    locations,
    selectedLocations,
    handleSelectSuppInfos,
    handleTeacherSelection,
    activities,
    selected_activities,
}) => {
    const uniqueSelectedActivities = _.uniq(selected_activities);
    const renderTeacherSelection = uniqueSelectedActivities.map((actId, i) => {
        const teachersForActivity = _.filter(teachers, teacher => {
            const teacherActivityRefIds = _.map(
                teacher.activity_refs,
                a => a.id,
            );
            return _.includes(teacherActivityRefIds, actId);
        });

        return (
            <div key={i}>
                <h5>{_.find(activities, { id: actId }).label}</h5>
                {_.map(teachersForActivity, (teacher, j) => {
                    return (
                        <div key={j} className="checkbox checkbox-primary">
                            <input
                                type="checkbox"
                                value={teacher.id}
                                id={
                                    actId.toString() +
                                    "-" +
                                    teacher.id.toString()
                                }
                                checked={_.includes(
                                    selectedTeachers[actId],
                                    teacher.id.toString(),
                                )}
                                onChange={evt =>
                                    handleTeacherSelection(
                                        _.split(evt.target.id, "-")[0],
                                        evt.target.value,
                                    )
                                }
                            />
                            <label
                                className="control-label"
                                htmlFor={teacher.id}
                            >
                                {teacher.first_name}&nbsp;{teacher.last_name}
                            </label>
                        </div>
                    );
                })}
            </div>
        );
    });

    const renderLocationSelection = locations.map((l, i) => {
        return (
            <div key={i} className="checkbox checkbox-primary">
                <input
                    type="checkbox"
                    value={l.id}
                    id={l.id}
                    checked={_.includes(selectedLocations, l.id.toString())}
                    onChange={evt =>
                        handleSelectSuppInfos(evt.target.value, "locations")
                    }
                />
                <label className="control-label" htmlFor={l.id}>
                    {l.label}
                </label>
            </div>
        );
    });

    return (
        <div className="row">
            <div className="col-lg-4 col-lg-offset-4">
                <div className="ibox">
                    <div className="ibox-title">
                        <h3>Préférences Annexes</h3>
                    </div>
                    <div className="ibox-content">
                        <div>
                            <h4>Professeur</h4>
                            {renderTeacherSelection}
                        </div>

                        <div>
                            <h4>Lieux</h4>
                            {renderLocationSelection}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplementaryPreferences;
