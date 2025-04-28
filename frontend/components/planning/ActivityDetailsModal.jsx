import React, {Fragment} from "react";
import _, {toInteger} from "lodash";
import Select from "react-select";
import ErrorList from "../common/ErrorList";
import * as TimeIntervalHelpers from "./TimeIntervalHelpers";
import {csrfToken, findAndGet, ISO_DATE_FORMAT, optionMapper, USER_OPTIONS} from "../utils";
import YearlyCalendar from "./YearlyCalendar";
import TabbedComponent from "../utils/ui/tabs";
import * as api from "../../tools/api";
import {AttendanceControl} from '../PresenceSheet'
import {withSave} from '../planning/activity_management/index'
import swal from "sweetalert2";

const moment = require("moment");
require("moment/locale/fr");

const getRoom = (rooms, id) => _.find(rooms, r => r.id == id);

const isEveil = activity => {
    return activity.activity_ref.has_additional_student;
};

const getTime = momentObj => {
    return momentObj.format("HH:mm");
};

const InstancesUpdateScope = Object.freeze({
    SINGULAR: 0, // Affect a single instance
    FOLLOWING: 1, // Affect instance and the ones after
    ALL: 2, // Affect season's room and all instances' rooms
});

// Utilisée uniquement pour les vue. Utilisée également par AttendancesTable.
// Forcé de faire de cette manière car React refuse de mettre à jours les composants après changement des states.
// Façon de faire à remplacer si quelqu'un trouve le pb de maj.
let viewAttendances = [];

let viewOptions = [];

let listUser = [];

class ActivityDetailsModal extends React.Component {
    constructor(props) {
        super(props);
        /* After validating, room_id, location_id, and activityId are undefined,
        only activity holds the information. To make code consistent,
        we start by copying these values at the correct place.*/

        let activity = undefined;

        if (props.interval.activity_instance) activity = props.interval.activity_instance.activity;
        else if (props.interval.activity) activity = props.interval.activity;

        const activityId = activity ? activity.activity_ref_id : props.activityId;

        const room_id = props.interval.activity_instance ? props.interval.activity_instance.room.id : activity ? activity.room.id : props.room_id;

        let location_id;
        if (activity) {
            location_id = _.filter(props.room_refs, room => room.id == room_id)[0].location_id;
        } else if (props.locations && props.locations.length === 1) {
            location_id = props.locations[0].id;
        } else {
            location_id = props.location_id;
        }

        const rooms_constrained = activity
            ? _.chain(props.rooms)
                .filter(room_ref => room_ref.location_id === location_id)
                .sortBy(["location_id", "label"])
                .value()
            : props.rooms;

        const teacher_id =
            activity && activity.teacher
                ? activity.teacher.id
                : (props.user && props.user.id) || 0;

        let mainTeacherId =
            activity &&
            _.filter(activity.teachers_activities, ta => ta.is_main)[0];
        mainTeacherId = mainTeacherId && mainTeacherId.user_id;

        let assistantTeacherId =
            activity &&
            _.filter(activity.teachers_activities, ta => !ta.is_main)[0];
        assistantTeacherId = assistantTeacherId && assistantTeacherId.user_id;

        const teachers_constrained = activity
            ? _.chain(props.teachers)
                .filter(teacher =>
                    _.chain(teacher.teachers_activity_refs)
                        .map(act => act.activity_ref_id)
                        .includes(activityId)
                        .value()
                )
                .sortBy(["last_name", "first_name"])
                .value()
            : props.teachers;

        let recurrences = [
            {
                start: moment(this.props.interval.start),
                selected: true,
            },
        ];

        if (this.props.interval.is_validated)
            recurrences = TimeIntervalHelpers.generateInstances(
                this.props.interval.start,
                this.props.seasons
            );

        const instance = {
            teacher_id: _.get(this.props.interval, "activity_instance.teachers_activity_instances[0].user_id"),
            evaluation_level_ref_id: _.get(this.props.interval, "activity_instance.activity.evaluation_level_ref_id"),
            instances_update_scope: InstancesUpdateScope.SINGULAR,
            ..._.pick(_.get(this.props.interval, "activity_instance"), ["room_id", "location_id", "are_hours_counted", "cover_teacher_id"]),
        };

        this.state = {
            activity: activity,
            room_id: room_id,
            location_id: location_id,
            activityId: activityId,
            teacher_id: teacher_id,
            mainTeacherId,
            assistantTeacherId,

            initial_room_id: room_id,
            initialMainTeacherId: mainTeacherId,
            initialAssistantTeacherId: assistantTeacherId,

            conflicting_interval: null,
            conflicting_interval_teacher: null,

            rooms_constrained: rooms_constrained,
            teachers_constrained: teachers_constrained,

            editionMode: false,

            startTime: moment(props.interval.start),
            endTime: moment(props.interval.end),

            isRecurrent: false,

            activityInstances: recurrences,

            changes: {
                recurrences,
                instance,
            },

            groupName: null,
            isEditingGroup: false,
            errors: [],
            attendances: [],
            options: [],
            submitting: this.props.savingActivityInstances
        };

        this.state.attendances = (_.get(this.props.interval, "activity_instance.student_attendances") || []).map(sa => {
            const attended = _.find(this.state.changes.attendances, (v, k) => sa.id == k);
            return attended !== undefined && attended != null && {
                ...sa,
                attended,
            } || {...sa};
        });

        viewAttendances = []
        listUser = []

        this.state.attendances.forEach(a => {
            listUser.push(a.user)
            viewAttendances.push({...a})
        });

        viewOptions = []

        this.state.options = (_.get(this.props.interval, "activity_instance.activity.options") || []).map(sa => {

            if (listUser.find(user => user.id === sa.desired_activity.activity_application.user.id) === undefined)
                return {...sa.desired_activity.activity_application.user};
        });

        // copy complète du tableau pour bien différencier métier et vue

        this.state.options = this.state.options.filter(element => {
            return element !== undefined;
        });
        this.state.options.forEach(o => {
            viewOptions.push(o)
        })

    }

    componentDidMount() {
        if (!this.props.generic) this.verifyTimeOverlap();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.savingActivityInstances !== this.props.savingActivityInstances) {
            this.setState({submitting: this.props.savingActivityInstances})
        }

    }

    // ===========================================
    // SELECTION HANDLERS
    // ===========================================
    handleSelectLocation(e) {
        const location_id = e.target.value;
        if (this.state.location_id != location_id) {
            const rooms = _.chain(this.props.rooms)
                .filter(room => room.location_id == location_id)
                .filter(room =>
                    _.chain(room.activity_refs)
                        .map(a => a.id)
                        .includes(this.state.activityId)
                        .value()
                )
                .sortBy(["location_id", "label"])
                .value();

            this.setState({
                rooms_constrained: rooms,
                location_id: location_id,
            });

            // Updating the room based on selected location
            // By default, we show the first room available for this location
            this.handleChangeRoom(_.head(rooms).id);
        }
    }

    handleSelectRoom(e) {
        this.handleChangeRoom(e.target.value);
    }

    handleGroupNameChange(value) {
        this.setState({groupName: value});
    }

    toggleGroupNameEdit() {
        this.setState({isEditingGroup: !this.state.isEditingGroup});
    }

    handleSelectActivity(e) {
        const activityId = parseInt(e.target.value);
        const teachers_constrained = _.chain(this.props.teachers)
            .filter(teacher =>
                _.chain(teacher.teachers_activity_refs)
                    .map(act => act.activity_ref_id)
                    .includes(activityId)
                    .value()
            )
            .sortBy(["last_name", "first_name"])
            .value();

        const rooms_constrained = _.chain(this.props.rooms)
            .filter(room =>
                _.chain(room.activity_refs)
                    .map(a => a.id)
                    .includes(activityId)
                    .value()
            )
            .sortBy(["location_id", "label"])
            .value();

        this.setState({
            activityId,
            teachers_constrained,
            rooms_constrained,
        });
    }

    handleChangeRoom(room_id) {
        // The time interval overlapping itself, we need to consider what was the selected room at the construction of the modal.
        if (this.state.initial_room_id != room_id) {
            const room_ref = _.find(
                this.props.room_refs,
                room_ref => room_ref.id == room_id
            );
            const location_id =
                room_ref && room_ref.location ? room_ref.location.id : null;

            const start = moment(this.state.startTime);
            const end = moment(this.state.endTime);

            fetch(`/time_interval/overlap_room/${room_id}`, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    start,
                    end,
                }),
            })
                .then(response => response.json())
                .then(conflicting_interval => {
                    this.setState({
                        isValidated: !!conflicting_interval,
                        room_id,
                        location_id,
                        conflicting_interval,
                    });
                });
        } else {
            // validation allowed if no teacher interval incoherence
            const isValidated = this.state.conflicting_interval_teacher
                ? false
                : true;
            this.setState({
                conflicting_interval: null,
                isValidated: isValidated,
                room_id: room_id,
            });
        }
    }

    /* handleChangeTeacher(teacherId, isMain) {
        const propToModify = isMain ? "mainTeacherId" : "assistantTeacherId";
        if (teacherId == 0) {
            this.setState({
                [propToModify]: null,
            });
            return;
        }

        // The time interval overlapping itself, we need to consider what was the selected teacher at the construction of the modal
        if (
            (isMain && this.state.initialMainTeacherId != teacherId) ||
            (!isMain && this.state.initialAssistantTeacherId != teacherId)
        ) {
            const start = moment(this.state.startTime);
            const end = moment(this.state.endTime);

            fetch(`/time_interval/overlap_teacher/${teacherId}`, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    start,
                    end,
                }),
            })
                .then(response => response.json())
                .then(conflicting_interval_teacher => {
                    this.setState({
                        isValidated: conflicting_interval_teacher
                            ? false
                            : true,
                        [propToModify]: teacherId,
                        conflicting_interval_teacher,
                    });
                });
        } else {
            // validation allowed if no room interval incoherence
            const isValidated = this.state.conflicting_interval ? false : true;

            this.setState({
                isValidated: isValidated,
                [propToModify]: teacherId,
                conflicting_interval_teacher: null,
            });
        }
    } */

    //TEACHERS EDITION HANDLERS
    handleChangeTeacher(teacherId, value) {
        const newTeacherId = parseInt(value);

        fetch(`/activity_instance/${this.props.interval.activity_instance.id}/teacher/${teacherId}`,
            {
                method: "POST",
                headers: {
                    "X-Csrf-Token": csrfToken,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    teacher: {
                        user_id: newTeacherId,
                    },
                }),
            }
        ).then(res => {
            if (res.ok) {
                //Feed teacher change back to user in UI

            }
        });
    }

    handleToggleIsMainTeacher(teacherId, isMain) {


        fetch(`/activity/${this.state.activity_id}/teacher/${teacherId}`, {
            method: "POST",
            headers: {
                "X-Csrf-Token": csrfToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                teacher: {
                    is_main: isMain,
                },
            }),
        }).then(res => {
            if (res.ok) {
                const newTeachersActivities = [
                    ...this.state.activity.teachers_activities,
                ].map(ta => {
                    if (ta.user_id === teacherId)
                        return {
                            ...ta,
                            is_main: isMain,
                        };
                    return ta;
                });

                this.setState({
                    activity: {
                        ...this.state.activity,
                        teachers_activities: newTeachersActivities,
                    },
                });
            }
        });
    }

    handleAddTeacher(teacherId) {


        fetch(`/activity/${this.state.activity_id}/teacher/${teacherId}`, {
            method: "PUT",
            headers: {
                "X-Csrf-Token": csrfToken,
                "Content-Type": "application/json",
            },
        })
            .then(res => res.json())
            .then(ta => {
                const newTeachersActivities = [
                    ...this.state.activity.teachers_activities,
                    ta,
                ];

                this.setState({
                    activity: {
                        ...this.state.activity,
                        teachers_activities: newTeachersActivities,
                    },
                });
            });
    }

    handleRemoveTeacher(teacherId) {


        fetch(`/activity/${this.state.activity_id}/teacher/${teacherId}`, {
            method: "DELETE",
            headers: {
                "X-Csrf-Token": csrfToken,
                "Content-Type": "application/json",
            },
        }).then(res => {
            const newTeachersActivities = this.state.activity.teacher_activities.filter(
                ta => ta.user_id !== teacherId
            );

            this.setState({
                activity: {
                    ...this.state.activity,
                    teachers_activities: newTeachersActivities,
                },
            });
        });
    }

    handleSelectTime(e, point) {
        this.setState(
            {[`${point}Time`]: this.getMoment(e.target.value)},
            () => this.verifyTimeOverlap()
        );
    }

    handleRemoveStudent(s) {
        const users = this.state.activity.users;
        _.remove(users, s);

        this.props.handleRemoveStudent(this.state.activity, s);

        this.setState({activity: {...this.state.activity, users}});
    }

    handleRemoveOptionalStudent(option) {
        const options = this.state.activity.options;
        _.remove(options, option);

        this.props.handleRemoveOptionalStudent(this.state.activity, option);

        this.setState({activity: {...this.state.activity, options}});
    }

    // ===============================================
    // MISC HELPERS
    // ===============================================
    getMoment(time) {
        const day = moment(this.props.interval.start).format(ISO_DATE_FORMAT);
        const res = moment(`${day}T${time}`);
        return res;
    }

    verifyTimeOverlap() {
        const startTime = moment(this.state.startTime);
        const endTime = moment(this.state.endTime);
        const room_id = this.state.room_id;
        const teacher_id = this.state.teacher_id;
        const time_interval_id = this.props.id;


        fetch(`/planning/overlap`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                startTime,
                endTime,
                room_id,
                teacher_id,
                time_interval_id,
            }),
        })
            .then(response => response.json())
            .then(conflicting_intervals => {
                this.setState({
                    isValidated:
                        !(conflicting_intervals.teacher == null ||
                            conflicting_intervals.room == null),
                    conflicting_interval: conflicting_intervals.room,
                    conflicting_interval_teacher: conflicting_intervals.teacher,
                });
            });
    }

    // =========================================
    // COMMIT HANDLERS
    // =========================================

    handleSaveActivityInstances() {
        const activityInstances = formatInstances(
            this.state.changes.recurrences,
            this.state.startTime,
            this.state.endTime,
        );

        this.props.handleSaveActivityInstances(
            this.props.interval.id,
            this.state,
            activityInstances
        );
    }

    handleUpdateActivity() {
        // Reset error on call
        this.setState({errors: []});

        // Get activity from state
        const activity = {id: this.state.activity.id, group_name: this.state.groupName};

        // Call api
        api
            .post(`/activity/${activity.id}`, {activity})
            .then(({data, error}) => {
                if (error) {
                    this.setState({errors: error});
                } else if (data) {
                    //room has been updated, close modal and feed it back in UI
                    if (
                        this.props.planningType === "room" &&
                        data.room_id !== this.state.activity.room_id
                    ) {
                        this.props.activityChangeFeedback(
                            this.props.interval.id,
                            this.props.planningType
                        );
                    } else {
                        this.setState({activity: data});
                    }

                    this.props.handleUpdateActivityInInstances(activity);
                    this.setState({isEditingGroup: false});
                }
            });
    }

    handleEditActivityInstance() {
        this.setState({editionMode: false});

        const instance = Object.assign({}, this.state, this.props.interval);
        instance.startTime = instance.startTime.toDate();
        instance.endTime = instance.endTime.toDate();

        this.props.handleEditActivityInstance(instance);

        this.props.closeModal();
    }

    handleRemove() {
        this.props.onRemove();
    }

    handleEditionMode() {
        this.setState({editionMode: true});
    }

    // ========================================
    // YEARLY CALENDAR HANDLERS
    // ========================================
    handleChangeRecurrentActivity(e) {
        const acts = !this.state.isRecurrent
            ? TimeIntervalHelpers.generateInstances(
                this.props.interval.start,
                this.props.seasons
            )
            : {
                [moment(this.props.interval.start).format(
                    ISO_DATE_FORMAT
                )]: {
                    date: moment(this.props.interval.start),
                    selected: true,
                },
            };

        const newState = {
            isRecurrent: !this.state.isRecurrent,
            activityInstances: acts,
        };

        if (newState.isRecurrent) {
            newState.changes = {
                recurrences: {...acts}
            }
        } else {
            newState.changes = {
                recurrences: {
                    0: Object.values(acts)[0]
                }
            }
        }

        this.setState(newState);
    }

    handlePickDateYearlyCalendar(selectedDay) {
        const recurrences = {...this.state.changes.recurrences};
        const key = selectedDay.format(ISO_DATE_FORMAT);

        if (recurrences[key]) {
            // It's already an instance, so we remove it
            const instance = {...recurrences[key]};
            instance.selected = !instance.selected;
            recurrences[key] = instance;
        } else {
            // It's not an instance, so we add it
            recurrences[key] = {
                start: selectedDay,
                selected: true,
            };
        }

        this.setState({
            changes: {
                ...this.state.changes,
                recurrences,
            },
        });
    }

    // ========================================
    // RENDERING HELPERS
    // ========================================

    renderTeacherSelection() {
        const renderMainTeacherOptions = this.state.teachers_constrained
            .filter(teacher => teacher.id !== this.state.assistantTeacherId)
            .map((teacher, i) => (
                <option key={i} value={teacher.id}>
                    {`${teacher.first_name} ${teacher.last_name}`}
                </option>
            ));

        const renderAssistantTeacherOptions = this.state.teachers_constrained
            .filter(teacher => teacher.id !== this.state.mainTeacherId)
            .map((teacher, i) => (
                <option key={i} value={teacher.id}>
                    {`${teacher.first_name} ${teacher.last_name}`}
                </option>
            ));

        return (
            <div className="flex-column m-b-md">
                <label className="label-control" htmlFor="o">
                    Professeur
                </label>
                <select
                    onChange={e =>
                        this.handleChangeTeacher(e.target.value, true)
                    }
                    value={this.state.mainTeacherId || 0}
                    className="form-control m-b"
                >
                    <option value={0} disabled>
                        Choisir un Professeur
                    </option>
                    {renderMainTeacherOptions}
                </select>
                <label className="label-control" htmlFor="o">
                    Autre professeur
                </label>
                <select
                    className="form-control m-b"
                    onChange={e =>
                        this.handleChangeTeacher(e.target.value, false)
                    }
                    value={this.state.assistantTeacherId || 0}
                >
                    <option value={0}>Choisir un Professeur</option>
                    {renderAssistantTeacherOptions}
                </select>
            </div>
        );
    }

    render() {
        const errors = [
            ...(this.props.errors || []),
            ...(this.state.errors || [])
        ];

        const start = moment.isMoment(this.state.startTime)
            ? moment(this.state.startTime).format("HH:mm")
            : moment(this.state.startTime.toDate()).format("HH:mm");
            const end = moment.isMoment(this.state.endTime)
        const timeIntervalInvalid = end <= start;

        const detectedSeason = TimeIntervalHelpers.getSeasonFromDate(
            this.state.startTime.toDate(),
            this.props.seasons
        );

        if (this.props.interval.is_validated && this.state.activity && !this.state.editionMode) {
            const room = getRoom(
                this.props.room_refs,
                this.state.room_id
            );

            let activities = [];
            if (this.props.planning) {
                if (this.props.planning.time_intervals) {
                    activities = _.map(
                        this.props.planning.time_intervals,
                        ti => ti.activity
                    );
                } else {
                    activities = _.map(
                        this.props.planning,
                        ti => ti.activity
                    );
                }
            }

            if (this.props.user && !this.props.user.is_teacher && !this.props.user.is_admin) {
                activities = _.map(
                    this.props.user.activities,
                    a => a.time_interval.activity
                );
            }

            const mainTeacher = this.props.teachers.find(
                t => t.id == this.state.mainTeacherId
            );

            const assistantTeacher = this.props.teachers.find(
                t => t.id == this.state.assistantTeacherId
            );

            let styleOptionalStudents = {color: "#9575CD"};

            const students = TimeIntervalHelpers.omitInactiveStudents(
                this.state.activity.users,
                this.props.interval.activity_instance.inactive_students
            );

            const studentIds = _.map(students, s => s.id);

            const optionalStudents = _.filter(
                this.state.activity.options,
                o =>
                    o.desired_activity &&
                    o.desired_activity.activity_application &&
                    !_.includes(
                        studentIds,
                        o.desired_activity.activity_application.user_id
                    )
            );

            const attendancesPanelContent =
                (this.props.isAdmin || this.props.isTeacher) &&
                ((students.length > 0 || optionalStudents.length > 0) &&
                    this.props.interval.activity_instance &&
                    this.props.interval.activity_instance
                        .student_attendances) ? (
                    <AttendanceTable
                        handleUpdateAll={(aids, attended) => {
                            const attendances = [];

                            this.state.attendances.forEach(a => attendances.push({...a}))

                            // maj des composant pour la vue
                            viewAttendances.forEach(a => {
                                if (aids.includes(a.id))
                                    a.attended = attended
                            });

                            const changesUpdate = aids.reduce((acc, id) => {
                                attendances.filter(a => a.id == id)[0].attended = toInteger(attended)
                                return ({
                                    ...acc,
                                    [id]: attended,
                                });
                            }, {});

                            const newState = {
                                changes: {
                                    ...this.state.changes,
                                    attendances: changesUpdate,
                                },
                                attendances: [...attendances],
                            };

                            this.setState(newState);

                            this.props.handleUpdateAllAttendances(this.props.interval.id, newState.changes.attendances || {});
                        }}
                        handleUpdate={(aid, attended) => {
                            const attendances = [...this.state.attendances];

                            const resIdx = attendances.findIndex(a => a.id == aid);

                            if (resIdx !== -1)
                                attendances[resIdx] = {
                                    ...attendances[resIdx],
                                    attended: toInteger(attended),
                                };

                            // maj du composant pour la vue
                            viewAttendances.forEach(a => {
                                if (a.id == aid)
                                    a.attended = attended;
                            });

                            const newState = {
                                changes: {
                                    ...this.state.changes,
                                    attendances: {...this.state.changes.attendances, [aid]: attended}
                                },
                                attendances: attendances
                            };

                            this.setState(newState);

                            this.props.handleUpdateAllAttendances(this.props.interval.id, newState.changes.attendances || {})
                        }
                        }
                    />
                ) : (
                    <h2 className="m-lg">
                        Pour le moment, aucun élève n'est inscrit à ce cours.
                    </h2>
                );

            const editionPanelContent = this.props.isAdmin || (this.props.isTeacher && this.props.teacher_can_edit && _.get(this.props.planning, "user.id") === this.props.currentUserId) ? (
                <ActivityEdition
                    selection={this.state.changes.instance}
                    rooms={this.props.room_refs}
                    evaluationLevelRefs={this.props.evaluation_level_refs}
                    locations={this.props.locations}
                    teachers={this.props.teachers}
                    startTime={this.state.startTime}
                    endTime={this.state.endTime}
                    onChange={(name, value) => this.setState({
                        changes: {
                            ...this.state.changes,
                            instance: {
                                ...this.state.changes.instance,
                                [name]: value,
                            },
                        },
                    })}/>
            ) : null;

            const recurrencesPanelContent = this.props.isAdmin || (this.props.isTeacher && this.props.teacher_can_edit && _.get(this.props.planning, "user.id") === this.props.currentUserId) ? (
                <div>
                    <YearlyCalendar
                        season={detectedSeason}
                        activityInstances={() => this.state.changes.recurrences}
                        existingDates={_.get(
                            this.props.interval,
                            "activity_instance.activity.activity_instances"
                        )}
                        handlePickDate={(date, classes) => this.handlePickDateYearlyCalendar(date, classes)}
                    />
                </div>
            ) : null;

            const instancePanelContent = this.props.isAdmin || (this.props.isTeacher && this.props.teacher_can_edit && _.get(this.props.planning, "user.id") === this.props.currentUserId) ? (
                <TeacherCoveringEditor
                    teacher={_.get(this.props.interval, "activity_instance.activity.teacher")}
                    coverTeacherId={_.get(this.state.changes, "instance.cover_teacher_id")}
                    areHoursCounted={_.get(this.state.changes, "instance.are_hours_counted")}
                    potentialCoveringTeachers={_.get(this.props.interval, "activity_instance.potential_covering_teachers")}
                    locations={this.props.locations}
                    rooms={this.props.rooms}
                    teachers={this.props.teachers}
                    onChange={(name, value) =>
                        this.setState({
                            changes: {
                                ...this.state.changes,
                                instance: {
                                    ...this.state.changes.instance,
                                    [name]: value,
                                },
                            },
                        })}/>
            ) : null;

            const tabs = [
                {
                    id: "attendances-tab",
                    header: "Présences",
                    active: true,
                    body: attendancesPanelContent,
                },
                {
                    id: "edition-tab",
                    header: "Cours",
                    active: false,
                    body: withSave(editionPanelContent, {
                        onSave: async () => {
                            this.setState({ isEditing: true });

                            swal({
                                title: "Modification en cours",
                                text: "Veuillez patienter...",
                                allowOutsideClick: false,
                                allowEscapeKey: false,
                                allowEnterKey: false,
                            });
                            swal.showLoading();

                            try {
                                await this.props.handleEditActivityInstance(this.state.changes.instance);
                                swal.close();
                            } catch (error) {
                                swal.close();
                                swal({
                                    title: "Erreur",
                                    text: "Une erreur est survenue lors de la modification",
                                    icon: "error"
                                });
                            } finally {
                                this.setState({ isEditing: false });
                            }
                        },
                        label: this.state.isEditing ? (
                            <>
                                Modifier <i className="fas fa-circle-notch fa-spin"></i>
                            </>
                        ) : (
                            "Modifier"
                        ),
                    }),
                },
                {
                    id: "instance-tab",
                    header: "Remplacement",
                    active: false,
                    body: withSave(instancePanelContent, {
                        onSave: () => this.props.handleEditActivityInstance(this.state.changes.instance),
                    }),
                },
                {
                    id: "recurrences-tab",
                    header: "Récurrences",
                    active: false,
                    body: (() => {
                        let disabled = false;

                        return withSave(recurrencesPanelContent, {
                            onSave: async () => {
                                if (disabled)
                                    return;

                                swal({
                                    title: "Mise à jour des récurrences",
                                    text: "Veuillez patienter...",
                                    allowOutsideClick: false,
                                    allowEscapeKey: false,
                                    allowEnterKey: false,
                                });

                                swal.showLoading();
                                disabled = true;
                                await this.props.handleUpdateActivityInstances(
                                    formatInstances(
                                        this.state.changes.recurrences,
                                        this.state.startTime,
                                        this.state.endTime,
                                    )
                                )

                                swal.close();
                                disabled = false;
                            },
                            label: "Mettre à jour les récurrences",
                        })
                    })(),
                },
            ];

            let deleteActivity =
                (this.props.isAdmin || (this.props.isTeacher && this.props.teacher_can_edit && _.get(this.props.planning, "user.id") === this.props.currentUserId)) && this.state.activity.users.length == 0 ? (
                    <React.Fragment>
                        <hr/>
                        <button
                            className="btn btn-warning"
                            onClick={() =>
                                this.props.handleDeleteActivityInstance(
                                    this.props.interval.activity_instance
                                        .id,
                                    this.state.activity.id
                                )
                            }
                        >
                            <i className="fas fa-trash m-r-sm"/>
                            Supprimer ce cours
                        </button>
                    </React.Fragment>
                ) : null;

            let result = (
                <div>
                    <div className="ibox">
                        <div className="ibox-title">
                            <ErrorList errors={errors}/>

                            {!this.state.isEditingGroup ?
                                <h2>
                                    {this.state.activity.group_name ? this.state.activity.group_name : "Groupe à définir"}
                                    <button
                                        title="Editer le nom du groupe de cette activité"
                                        className="btn btn-primary btn-sm pull-right"
                                        onClick={() => this.toggleGroupNameEdit()}
                                    >
                                        <i className="fas fa-edit"/>
                                    </button>
                                </h2>
                                :
                                <EditGroupNameInput
                                    onChange={(value) => this.handleGroupNameChange(value)}
                                    value={this.state.groupName || this.state.activity.group_name}
                                    onSave={() => this.handleUpdateActivity()}
                                />
                            }
                            <h3>
                                {this.state.activity.activity_ref.label} -{" "}
                                {room.label} -{" "}
                                {moment(this.props.interval.start).format("HH:mm")}{" "}
                                - {moment(this.props.interval.end).format("HH:mm")}
                            </h3>
                            <h4>
                                <i className="fas fa-users"/>{" "}
                                <span
                                    style={
                                        optionalStudents.length != 0
                                            ? styleOptionalStudents
                                            : null}>
                                    {students.length + optionalStudents.length}
                                </span>{" "}
                                /{this.state.activity.activity_ref.occupation_limit}
                            </h4>

                            {
                                this.props.interval.comment &&
                                <div className="alert alert-info">
                                    <strong>Commentaire du professeur</strong><br/>
                                    {this.props.interval.comment.content}
                                </div>
                            }
                        </div>
                        <div className="ibox-content no-padding">
                            <TabbedComponent tabs={tabs}/>
                        </div>
                        <button className="btn m-t" onClick={this.props.closeModal} type="button">
                            <i className="fas fa-times m-r-sm"/>
                            Fermer
                        </button>
                    </div>
                    {deleteActivity}
                </div>
            );

            return result;
        }

        return (
            <div>
                {!this.props.generic && (this.props.isAdmin || this.props.isTeacher) ? (
                    <React.Fragment>
                        <h3>Création d'une activité</h3>
                        <hr/>
                        {this.state.conflicting_interval ? (
                            <div className="alert alert-danger">
                                <p>
                                    La
                                    salle <b>{findAndGet(this.props.rooms, {id: parseInt(this.state.room_id)}, "label", "??")}</b>
                                    &nbsp;est déjà occupée de <b>{moment(
                                    this.state.conflicting_interval.start
                                ).format("HH[h]mm") /*[] in format is the escaping sequence*/}</b> à <b>{moment(
                                    this.state.conflicting_interval.end
                                ).format("HH[h]mm")}</b>
                                </p>
                            </div>
                        ) : null}
                        {this.state.conflicting_interval_teacher != null ? (
                            <div className="alert alert-danger">
                                <p>
                                    Le professeur "
                                    {this.props.planning.user.first_name}{" "}
                                    {this.props.planning.user.last_name}" est
                                    déjà occupé durant ce créneau horaire (
                                    {moment(
                                        this.state.conflicting_interval_teacher
                                            .start
                                    ).format("HH:mm")}{" "}
                                    -{" "}
                                    {moment(
                                        this.state.conflicting_interval_teacher
                                            .end
                                    ).format("HH:mm")}
                                    )
                                </p>
                            </div>
                        ) : null}
                        {timeIntervalInvalid ? (
                            <div className="alert alert-danger">
                                <p>Le créneau horaire est invalide.</p>
                            </div>
                        ) : null}


                        <TimeSelection
                            startTime={this.state.startTime}
                            endTime={this.state.endTime}
                            handleSelectTime={(e, point) =>
                                this.handleSelectTime(e, point)
                            }
                        />

                        <ActivitySelection
                            activities={this.props.userActivities}
                            activityId={this.state.activityId}
                            handleSelectActivity={e =>
                                this.handleSelectActivity(e)
                            }
                        />

                        <LocationSelection
                            locations={this.props.locations}
                            locationId={this.state.location_id}
                            handleSelectLocation={e =>
                                this.handleSelectLocation(e)
                            }
                        />

                        <RoomSelection
                            roomsConstrained={this.state.rooms_constrained}
                            roomId={this.state.room_id}
                            roomRefs={this.props.room_refs}
                            handleSelectRoom={e => this.handleSelectRoom(e)}
                        />

                        <div className="form-group">
                            <div className="checkbox checkbox-primary">
                                <input
                                    className="form-control"
                                    type="checkbox"
                                    value={this.state.isRecurrent}
                                    onChange={e =>
                                        this.handleChangeRecurrentActivity(e)
                                    }
                                />
                                <label className="control-label">
                                    Cette activité est récurrente
                                </label>
                            </div>

                            {this.state.isRecurrent &&
                            _.size(this.state.activityInstances) > 0 ? (
                                <YearlyCalendar
                                    label={_.get(detectedSeason, "label")}
                                    season={detectedSeason}
                                    holidays={_.get(detectedSeason, "holidays")}
                                    activityInstances={() => this.state.changes.recurrences}
                                    handlePickDate={(date, classes) =>
                                        this.handlePickDateYearlyCalendar(
                                            date,
                                            classes
                                        )
                                    }
                                />
                            ) : null}
                        </div>
                        {
                            this.props.interval.comment &&
                            <div className="alert alert-info">
                                <strong>Commentaire du professeur</strong><br/>
                                {this.props.interval.comment.content}
                            </div>
                        }
                        <ErrorList errors={errors}/>
                        <button
                            className="btn btn-primary"
                            onClick={() => this.handleSaveActivityInstances()}
                            disabled={
                                this.state.conflicting_interval ||
                                moment(this.state.startTime, "HH:mm") >
                                moment(this.state.endTime, "HH:mm")
                            }>
                            {this.state.isRecurrent
                                ? "Créer les cours de cette activité "
                                : "Créer ce cours "}
                            {this.state.submitting ?
                                <i className="fas fa-circle-notch fa-spin"></i>
                                :
                                ""}
                        </button>
                        <hr/>
                    </React.Fragment>
                ) : null}
                <div className="flex flex-space-between-justified">
                    <button className="btn" onClick={this.props.closeModal} type="button">
                        <i className="fas fa-times m-r-sm"/>
                        Fermer
                    </button>
                    <button
                        className="btn btn-warning"
                        onClick={id => {
                            this.props.handleDeleteInterval(this.props.interval.id);
                        }}
                    >
                        <i className="fas fa-trash m-r-sm"/>
                        Supprimer le créneau
                    </button>
                </div>
            </div>
        );
    }
}

class AttendanceTable extends React.Component {
    constructor(props) {
        super(props);

        this.state =
            {
                attendances: viewAttendances,
                options: viewOptions
            }
    }

    render() {
        const {handleUpdate, handleUpdateAll} = this.props;

        let bulkValue = null;

        if (this.state.attendances.reduce((acc, sa) => acc && sa.attended === 1, true))
            bulkValue = 1;
        else if (this.state.attendances.reduce((acc, sa) => acc && sa.attended === 0, true))
            bulkValue = 0;
        else if (this.state.attendances.reduce((acc, sa) => acc && sa.attended === 2, true))
            bulkValue = 2;
        else if (this.state.attendances.reduce((acc, sa) => acc && sa.attended === 3, true))
            bulkValue = 3;

        let styleOptionalStudents = {color: "#9575CD"};

        return <table className="table">
            <thead>
            <tr>
                <th>N° Adh</th>
                <th>Elève</th>
                <th>
                    Présent
                    <AttendanceControl
                        value={bulkValue}
                        handleUpdate={v => {
                            handleUpdateAll(this.state.attendances.map(a => a.id), v);
                            this.forceUpdate();
                        }
                        }/>
                </th>
            </tr>
            </thead>

            <tbody>
            {this.state.attendances
                .sort((a, b) => a.user.last_name.toLowerCase().localeCompare(b.user.last_name.toLowerCase()))
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
                        <td>
                            <AttendanceControl
                                value={a.attended}
                                handleUpdate={v => {
                                    handleUpdate(a.id, v);
                                    this.forceUpdate();
                                }}/>
                        </td>
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
                ))}
            {this.state.options
                .map((a, i) => (
                    <tr
                        key={i}
                        style={styleOptionalStudents}
                    >
                        <td>{a.adherent_number}</td>
                        <td>
                            <a href={`/users/${a.id}`}
                               style={styleOptionalStudents}
                            >
                                {a.last_name}
                                &nbsp;
                                {`${a.first_name}, ${moment().diff(
                                    a.birthday,
                                    "years"
                                )} ans `} (option)
                            </a>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    }
}

class EditGroupNameInput extends React.PureComponent {
    constructor(props) {
        super(props);

        this.debounce = null;

        this.state = {value: this.props.value || ""};
    }

    handleInputChange(value) {
        if (this.debounce) {
            clearTimeout(this.debounce);
        }

        this.debounce = setTimeout(() => {
            this.props.onChange(value);
            this.debounce = null;
        }, 400);

        this.setState({value});
    }

    render() {
        return (
            <Fragment>
                <div className="input-group m-b-md">
                    <span className="input-group-addon">
                        {"Nom du groupe"}
                    </span>
                    <input
                        className="form-control"
                        type="text"
                        value={this.state.value}
                        onChange={(e) => this.handleInputChange(e.target.value)}
                        name="groupName"
                    />
                    <span className="input-group-btn">
                        <button className="btn btn-primary" onClick={this.props.onSave}>
                            {"Enregistrer"}
                        </button>
                    </span>
                </div>

                <p className="alert alert-info">
                    {"Changer le nom du groupe pour cette instance le modifiera pour toutes les occurences de cette activité."}
                </p>
            </Fragment>
        );
    }
}

const GroupNameInput = ({
                            value,
                            onChange,
                        }) => {
    return (
        <div className="form-group">
            <label className="control-label" htmlFor="groupName">
                {"Nom du groupe"}
            </label>

            <input
                className="form-control"
                type="text"
                maxLength={12}
                value={!value ? "" : value}
                name="groupName"
                onChange={e => onChange(e.target.value)}
            />
        </div>
    );
};

const TimeSelection = ({startTime, endTime, handleSelectTime}) => {
    const start = moment(startTime.toDate());
    const end = moment(endTime.toDate());
    return (
        <form>
            <div className="row m-b">
                <div className="col-md-2">
                    <label className="control-label" htmlFor="o">
                        Début
                    </label>
                </div>
                <div className="col-md-4">
                    <input
                        className="form-control"
                        type="time"
                        onChange={e => handleSelectTime(e, "start")}
                        value={start.format("HH:mm")}
                    />
                </div>
                <div className="col-md-2">
                    <label className="control-label" htmlFor="o">
                        Fin
                    </label>
                </div>
                <div className="col-md-4">
                    <input
                        className="form-control"
                        type="time"
                        onChange={e => handleSelectTime(e, "end")}
                        value={end.format("HH:mm")}
                    />
                </div>
            </div>
        </form>
    );
};

const ActivitySelection = ({
                               activities,
                               activityId,
                               handleSelectActivity,
                           }) => {
    return (
        <form>
            <label className="control-label" htmlFor="o">
                Activité
            </label>
            <select
                className="form-control m-b"
                onChange={e => handleSelectActivity(e)}
                value={activityId || 0}
            >
                <option value={0} disabled>
                    Choisir une activité
                </option>
                {_.map(activities.sort((a, b) => a.label.localeCompare(b.label)), (activity, i) => {
                    return (
                        <option key={i} value={activity.id}>
                            {activity.label} ({activity.kind}) {activity.duration ? `- ${activity.duration} min` : ''}
                        </option>
                    );
                })}

            </select>
        </form>
    );
};

const LocationSelection = ({locations, locationId, handleSelectLocation}) => {

    if (locations.length === 1) {
        return (
            <div>
                <label className="control-label">
                    Lieu
                </label>
                <p className="form-control-static">
                    {locations[0].label}
                </p>
            </div>
        );
    }

    return (
        <form>
            <label className="control-label" htmlFor="o">
                Lieu
            </label>
            <select
                className="form-control m-b"
                onChange={e => handleSelectLocation(e)}
                value={locationId || 0}
            >
                <option value={0} disabled>
                    Choisir un Lieu
                </option>
                {_.map(locations, (l, i) => {
                    return (
                        <option key={i} value={l.id}>
                            {l.label}
                        </option>
                    );
                })}
            </select>
        </form>
    );
};

const RoomSelection = ({
                           roomsConstrained,
                           roomId,
                           roomRefs,
                           handleSelectRoom,
                       }) => {
    const renderRoomOptions = _.map(roomsConstrained, (room, i) => {
        return (
            <option key={i} value={room.id}>
                {room.label}
            </option>
        );
    });

    const renderAllRoomOptions = _.map(roomRefs, (room, i) => {
        return (
            <option key={i} value={room.id}>
                {room.label}
            </option>
        );
    });

    return (
        <form>
            <label className="control-label" htmlFor="o">
                Salle
            </label>
            {roomsConstrained.length > 0 ? (
                <select
                    className="form-control m-b"
                    onChange={e => handleSelectRoom(e)}
                    value={roomId || 0}
                >
                    <option value={0} disabled>
                        Choisir une salle
                    </option>
                    {renderRoomOptions}
                </select>
            ) : (
                <React.Fragment>
                    <p>
                        Aucune salle adaptée disponible pour ce cours, autres
                        salles:
                    </p>
                    <select className="form-control m-b" onChange={e => handleSelectRoom(e)} value={roomId || 0}>
                        <option value={0} disabled>
                            Choisir une salle
                        </option>
                        {renderAllRoomOptions}
                    </select>
                </React.Fragment>
            )}
        </form>
    );
};

class ActivityEdition extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            ...props.selection,
            startDate: moment(props.startTime).format('YYYY-MM-DD'),
            endTime: moment(props.endTime).format('HH:mm'),
            startTime: moment(props.startTime).format('HH:mm')
        };


    }

    render() {
        const {
            selection,
            startTime,
            endTime,
            locations,
            rooms,
            evaluationLevelRefs,
            teachers,
            onChange,
        } = this.props;
        const {
            teacher_id: selectedTeacherId,
            location_id: selectedLocationId,
            room_id: selectedRoomId,
            instances_update_scope: selectedInstancesUpdateScope = InstancesUpdateScope.SINGULAR,
            evaluation_level_ref_id: selectedEvaluationLevelRefId,
        } = this.state;

        const _onChange = (name, value) => {
            onChange(name, value);

            const newState = {...this.state};
            newState[name] = value;

            this.setState(newState);
        };

        return (
            <div>
                <div className="input-group m-b-xs w-100 mb-4">
                    <label>Date</label>
                    <input
                        name="startDate"
                        type="date"
                        className="form-control"
                        value={this.state.startDate}
                        onChange={({target: {name, value}}) => _onChange(name, value)}
                    />
                </div>
                <div className="flex flex-end-aligned m-b-sm w-100 mb-4">
                    <div className="imput-group mr-2 w-100">
                        <label>Début</label>
                        <input
                            name="startTime"
                            type="time"
                            className="form-control"
                            value={this.state.startTime}
                            onChange={({target: {name, value}}) => _onChange(name, value)}
                        />
                    </div>
                    <div className="imput-group ml-2 w-100">
                        <label>Fin</label>
                        <input
                            name="endTime"
                            type="time"
                            className="form-control"
                            value={this.state.endTime}
                            onChange={({target: {name, value}}) => _onChange(name, value)}
                        />
                    </div>
                </div>
                <div className="input-group m-b-xs w-100 mb-4">
                    <label>Emplacement</label>
                    <select
                        name="location_id"
                        className="form-control"
                        value={selectedLocationId}
                        onChange={({target: {name, value}}) => _onChange(name, value)}>
                        {locations.map(optionMapper())}
                    </select>
                </div>
                <div className="input-group m-b-xs w-100 mb-4">
                    <label>Niveau global</label>
                    <select
                        name="evaluation_level_ref_id"
                        className="form-control"
                        value={selectedEvaluationLevelRefId || ""}
                        onChange={({target: {name, value}}) => _onChange(name, value)}>
                        <option value="">A PRECISER</option>
                        {evaluationLevelRefs.map(optionMapper())}
                    </select>
                </div>
                <div className="flex flex-end-aligned m-b-sm mb-4">
                    <div className="input-group mr-4 mb-4">
                        <label>Salle</label>
                        <select
                            name="room_id"
                            className="form-control"
                            value={selectedRoomId}
                            onChange={({target: {name, value}}) => {
                                _onChange(name, parseInt(value));
                            }}>
                            {rooms
                                .filter(r => r.location.id == selectedLocationId)
                                .map(optionMapper())}
                        </select>
                    </div>
                    <select
                        onChange={({target: {name, value}}) => _onChange(name, parseInt(value))}
                        value={selectedInstancesUpdateScope}
                        className="form-control mb-4"
                        name="instances_update_scope"
                        style={{flex: "1 1"}}>
                        <option value={InstancesUpdateScope.SINGULAR}>N'affecter que cette séance</option>
                        <option value={InstancesUpdateScope.FOLLOWING}>Affecter cette séance et les suivantes</option>
                        <option value={InstancesUpdateScope.ALL}>Affecter toutes les séances de la saison</option>
                    </select>
                </div>

                <div className="alert alert-warning" style={{width: "500px"}}>
                    <b>Attention : </b>Aucune vérification n'est faite lors d'un
                    changement de professeur. Le changement de professeur ne sera
                    opéré qu'à partir de cette séance, et répercuté sur toutes celles
                    la suivant.
                </div>

                {selectedTeacherId ? (
                    <div className="input-group m-b-sm w-100">
                        <label>Professeur</label>
                        <select
                            className="form-control"
                            name="teacher_id"
                            onChange={({target: {name, value}}) => _onChange(name, value)}
                            value={selectedTeacherId}>
                            {_.map(teachers, optionMapper(USER_OPTIONS))}
                        </select>
                    </div>
                ) : (
                    "Aucun professeur principal pour ce cours"
                )}
            </div>
        );
    };
}

const TeachersEditor = ({
                            teachers,
                            selected,
                            onChangeTeacher,
                            onToggleIsMainTeacher,
                            onAddTeacher,
                            onRemoveTeacher,
                        }) => {
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
                                        {`${teachers.find(
                                            t => t.id === ta.user_id
                                        ).first_name
                                        } ${teachers.find(
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
                                style={{margin: "auto"}}
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
                                <i className="fas fa-times"/>
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
                            <option value=""/>
                            {notSelectedTeachersOptions}
                        </select>
                    </td>
                    <td/>
                    <td/>
                </tr>
                </tbody>
            </table>
        </div>
    );
}

const coveringEditorSelectStyles = {
    option: (styles, {data}) => {
        return {
            ...styles,
            color: data.canCover ? "forestgreen" : "#c2c2c2",
        };
    },
};

const TeacherCoveringEditor = ({
                                   teacher,
                                   coverTeacherId,
                                   areHoursCounted,
                                   potentialCoveringTeachers,
                                   teachers,
                                   onChange,
                               }) => {
    const teachersOptions = [
        {
            label: "PAS DE REMPLAÇANT",
            value: "",
            canCover: true,
        },
        ..._(teachers)
            .filter(t => t.id !== _.get(teacher, "id"))
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
                                onChange={({target: {checked, name}}) =>
                                    onChange(name, true)
                                }/>
                            Oui
                        </div>
                        <div className="flex flex-end-aligned">
                            <input
                                type="radio"
                                name="are_hours_counted"
                                checked={!areHoursCounted}
                                onChange={({target: {checked, name}}) =>
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

const formatInstances = (instances, startTime, endTime) => _(instances)
    .filter(instance => instance.selected)
    .map(ai => ({
        start: moment(ai.start)
            .hour(startTime.hour())
            .minute(startTime.minute())
            .format(),
        end: moment(ai.start)
            .hour(endTime.hour())
            .minute(endTime.minute())
            .format(),
    }))
    .value();

export default ActivityDetailsModal;
