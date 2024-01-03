import React, { Component, Fragment } from "react";
import _ from "lodash";
const moment = require("moment");

import ErrorList from "../../common/ErrorList";

import { csrfToken, ISO_DATE_FORMAT } from "../../utils";

import TabbedComponent from "../../utils/ui/tabs";

import * as api from "../../../tools/api";
import * as TimeIntervalHelpers from "../TimeIntervalHelpers";

import AttendanceTable from "./attendance_table";
import ActivityEdition from "./activity_edition";
import EditGroupNameInput from "./edit_group_name_input";
import RecurrencesEditor from "./recurrences_editor";
import TeacherCoveringEditor from "./teacher_covering_editor";

const getRoom = (rooms, id) => _.find(rooms, r => r.id == id);

export const withSave = (component, {
    onSave = () => {},
    label = "Enregistrer"
} = {}) => <div>
    {component}
    <button className="btn btn-primary pull-right" onClick={onSave}>
        {label}
    </button>
</div>;

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

export default class ActivityManagement extends Component {
    constructor(props) {
        super(props);

        /* After validating, room_id, location_id, and activityId are undefined,
        only activity holds the information. To make code consistent,
        we start by copying these values at the correct place.*/

        let activity = undefined;

        if (props.interval.activity_instance)
            activity = props.interval.activity_instance.activity;
        else if (props.interval.activity) activity = props.interval.activity;

        const activityId = activity
            ? activity.activity_ref_id
            : props.activityId;

        const room_id = activity ? activity.room.id : props.room_id;

        const location_id = activity
            ? _.filter(props.room_refs, room => room.id == room_id)[0]
                  .location_id
            : // ? activity.room.location_id
              props.location_id;

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
            cover_teacher_id: _.get(props.interval, "activity_instance.cover_teacher_id"),
            are_hours_counted: _.get(props.interval, "activity_instance.are_hours_counted")
        };

        this.state = {
            activity: activity,
            room_id: room_id,
            location_id: location_id,
            activityId,
            teacher_id: teacher_id,
            mainTeacherId,
            assistantTeacherId,

            initial_room_id: room_id,
            initialMainTeacherId: mainTeacherId,
            initialAssistantTeacherId: assistantTeacherId,

            conflicting_interval: null,
            conflicting_interval_teacher: null,

            rooms_constrained,
            teachers_constrained,

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
            errors: []
        };
    }

    // ===========================================
    // SELECTION HANDLERS
    // ===========================================
    toggleGroupNameEdit() {
        this.setState({ isEditingGroup: !this.state.isEditingGroup });
    }

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

    handleRemoveStudent(s) {
        const users = this.state.activity.users;
        _.remove(users, s);

        this.props.handleRemoveStudent(this.state.activity, s);

        this.setState({ activity: { ...this.state.activity, users } });
    }

    handleRemoveOptionalStudent(option) {
        const options = this.state.activity.options;
        _.remove(options, option);

        this.props.handleRemoveOptionalStudent(this.state.activity, option);

        this.setState({ activity: { ...this.state.activity, options } });
    }
    
    handleUpdateActivity() {
        // Reset error on call
        this.setState({ errors: [] });

        // Get activity from state
        const activity = { id: this.state.activity.id, group_name: this.state.groupName };

        // Call api
        api
            .post(`/activity/${activity.id}`, { activity })
            .then(({ data, error }) => {
                if (error) {
                    this.setState({ errors: error });
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
                        this.setState({ activity: data });
                    }

                    this.props.handleUpdateActivityInInstances(activity);
                    this.setState({ isEditingGroup: false });
                }
            });
    }

    handleEditActivityInstance() {
        this.setState({ editionMode: false });

        const instance = Object.assign({}, this.state, this.props.interval);
        instance.startTime = instance.startTime.toDate();
        instance.endTime = instance.endTime.toDate();

        this.props.handleEditActivityInstance(instance);

        this.props.closeModal();
    }

    handlePickDateYearlyCalendar(selectedDay) {
        const recurrences = { ...this.state.changes.recurrences };
        const key = selectedDay.format(ISO_DATE_FORMAT);
        
        if (recurrences[key]) {
            // It's already an instance, so we remove it
            const instance = { ...recurrences[key] };
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

    handleRemove() {
        this.props.onRemove();
    }

    handleEditionMode() {
        this.setState({ editionMode: true });
    }

    handleGroupNameChange(value) {
        this.setState({ groupName: value });
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
        const detectedSeason = TimeIntervalHelpers.getSeasonFromDate(
            this.state.startTime.toDate(),
            this.props.seasons
        );

        const errors = this.props.errors.concat(this.state.errors);

        if (!this.state.editionMode) {
            const room = getRoom(
                this.props.room_refs,
                this.state.activity.room.id
            );

            let styleOptionalStudents = { color: "#9575CD" };

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

            const attendances = (_.get(this.props.interval, "activity_instance.student_attendances") || []).map(sa => {
                const attended = _.find(this.state.changes.attendances, (v, k) => sa.id == k);
                return attended !== undefined && {
                    ...sa,
                    attended,
                } || { ...sa };
            });

            const attendancesPanelContent =
                (this.props.isAdmin || this.props.isTeacher) &&
                ((students.length > 0 || optionalStudents.length > 0) &&
                    this.props.interval.activity_instance &&
                    this.props.interval.activity_instance
                        .student_attendances) ? (
                    <AttendanceTable
                        attendances={attendances}
                        handleUpdateAll={(aids, attended) => {
                            const changesUpdate = aids.reduce((acc, id) => ({
                                ...acc,
                                [id]: attended,
                            }), {});

                            this.setState({
                                changes: {
                                    ...this.state.changes,
                                    attendances: changesUpdate,
                                }
                            })
                        }}
                        handleUpdate={(aid, attended) => this.setState({
                            changes: {
                                ...this.state.changes,
                                attendances: {
                                    ...this.state.changes.attendances,
                                    [aid]: attended,
                                },
                            },
                        })}
                    />
                ) : (
                    <h2 style={{ margin: "auto" }}>
                        Impossible d'éditer les présences
                    </h2>
                );

            const activitySelection = {
                teacher_id: _.get(this.props.interval, "activity_instance.teachers_activity_instances[0].user_id"),
                ..._.pick(_.get(this.props.interval, "activity_instance"), ["room_id", "location_id"]),
                ...this.state.changes.instance,
            };

            const editionPanelContent = this.props.isAdmin ? (
                <ActivityEdition
                    selection={activitySelection}
                    rooms={this.props.room_refs}
                    locations={this.props.locations}
                    teachers={this.props.teachers}
                    onChange={(name, value) => this.setState({
                        changes: {
                            ...this.state.changes,
                            instance: {
                                ...this.state.changes.instance,
                                [name]: value,
                            },
                        },
                    })} />
            ) : null;

            const recurrencesPanelContent = this.props.isAdmin ? (
                <RecurrencesEditor
                    existingDates={_.get(
                        this.props.interval,
                        "activity_instance.activity.activity_instances"
                    )}
                    recurrences={this.state.changes.recurrences}
                    season={detectedSeason}
                    onUpdateInstances={(date, classes) =>
                        this.handlePickDateYearlyCalendar(date, classes)
                    }/>
            ) : null;

            const instancePanelContent = this.props.isAdmin ? (
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
                    body: withSave(attendancesPanelContent, {
                        onSave: () => this.props.handleUpdateAllAttendances(this.props.interval.id, this.state.changes.attendances || {})
                    }),
                },
                {
                    id: "edition-tab",
                    header: "Cours",
                    active: false,
                    body: withSave(editionPanelContent, {
                        onSave: () => this.props.handleEditActivityInstance(this.state.changes.instance),
                        label: "Modifier ce cours et les suivants",
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
                    body: withSave(recurrencesPanelContent, {
                        onSave: () => this.props.handleUpdateActivityInstances(
                            formatInstances(
                                this.state.changes.recurrences,
                                this.state.startTime,
                                this.state.endTime,
                            )
                        ),
                        label: "Mettre à jour les récurrences",
                    }),
                },
            ];

            let deleteActivity =
                this.props.isAdmin &&
                this.state.activity.users.length == 0 ? (
                    <React.Fragment>
                        <hr />
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
                            <i className="fas fa-trash m-r-sm" />
                            Supprimer ce cours
                        </button>
                    </React.Fragment>
                ) : null;

            let result = (
                <div>
                    <div className="ibox">
                        <div className="ibox-title">
                            <ErrorList errors={errors} />

                            {!this.state.isEditingGroup ? 
                                <h2>
                                    {this.state.activity.group_name ? this.state.activity.group_name : "Groupe à définir"}
                                    <button 
                                        title="Editer le nom du groupe de cette activité"
                                        className="btn btn-primary btn-sm pull-right"
                                        onClick={() => this.toggleGroupNameEdit()}
                                    >
                                        <i className="fas fa-edit" />
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
                                <i className="fas fa-users" />{" "}
                                <span
                                    style={
                                        optionalStudents.length != 0
                                            ? styleOptionalStudents
                                            : null}>
                                    {students.length + optionalStudents.length}
                                </span>{" "}
                                /{this.state.activity.activity_ref.occupation_limit}
                            </h4>
                        </div>
                        <div className="ibox-content no-padding">
                            <TabbedComponent tabs={tabs} />
                        </div>
                    </div>
                    {deleteActivity}
                </div>
            );

            return result;
        }
    }
}