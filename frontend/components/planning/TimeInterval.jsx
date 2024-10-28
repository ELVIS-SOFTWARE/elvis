import React from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import { subnetMatch } from "ipaddr.js";

const moment = require("moment");
require("moment/locale/fr");

const getRoom = (rooms, id) => _.find(rooms, r => r.id == id);
const getTeacher = (activity, activities) => {
    if (activity.time_interval == undefined || activities == undefined) {
        return null;
    }
    const planning = _.find(
        activity.time_interval.plannings,
        p => p.user.is_teacher == true
    );

    return planning ? planning.user : null;
};

class TimeInterval extends React.Component {
    levelDisplay(users, activityRefId) {
        return "Banana";
        // if (users.length > 0) {
        //     if (users[0].levels.length > 0) {
        //         const levelLabel = _.find(
        //             users[0].levels,
        //             level => level.activity_ref_id == activityRefId,
        //         );
        //         return levelLabel != undefined
        //             ? levelLabel.evaluation_level_ref.label
        //             : "";
        //     }
        // }
    }

    handleClick(e) {
        e.stopPropagation();
        this.props.handleDelete(this.props.uid);
    }

    handleDelete(e) {
        e.stopPropagation();
        this.props.handleDeleteActivity(this.props.activity.id);
    }

    render() {
        let label = "";
        switch (this.props.kind) {
            case "o":
                label = "Option";
                break;
            case "c":
                label = "Cours";
                break;
            case "p":
            default:
                label = "Dispo.";
                break;
        }

        let styleOptions = { color: "#9575CD" };

        if (this.props.is_validated && this.props.activity) {
            const room = getRoom(
                this.props.room_refs,
                this.props.activity.room_id
            );

            let activities = [];
            if (this.props.planning.time_intervals) {
                activities = _.map(
                    this.props.planning.time_intervals,
                    ti => ti.activity
                );
            } else {
                activities = _.map(this.props.planning, ti => ti.activity);
            }

            if (
                this.props.user &&
                !this.props.user.is_teacher &&
                !this.props.user.is_admin
            ) {
                activities = _.map(
                    this.props.user.activities,
                    a => a.time_interval.activity
                );
            }

            const teacherId =
                this.props.activity &&
                this.props.activity.teachers_activities &&
                this.props.activity.teachers_activities.find(x => x.is_main)
                    .user_id;
            const teacher =
                teacherId && this.props.teachers.find(t => t.id == teacherId);

            let levelAndAge = "";
            if (this.props.activity.users.length > 0) {
                const levelDisplay = this.levelDisplay(
                    this.props.activity.users,
                    this.props.activity.activity_ref_id
                );
                const averageAge = Math.floor(
                    this.props.activity.users
                        .map(u => moment().diff(u.birthday, "years"))
                        .reduce((sum, val) => sum + val, 0) /
                        this.props.activity.users.length
                );
                levelAndAge = ` - ${levelDisplay} - ${averageAge} ans`;
            }

            let location = "LH";
            if (this.props.activity.location.label == "Harfleur") {
                location = "HA";
            }

            const teacherName = teacher ? (
                <p>{`${teacher.first_name} ${teacher.last_name}`}</p>
            ) : null;

            let activityKind = "lesson";
            switch (this.props.activity.activity_ref.kind) {
                case "Enfance":
                    activityKind = "enfance";
                    break;
                case "CHAM":
                    activityKind = "cham";
                    break;
                case "ATELIERS":
                    activityKind = "atelier";
                    break;
            }

            const students = this.props.activity.users;
            const studentIds = _.map(students, s => s.id);
            const options = _.filter(
                this.props.activity.options,
                o =>
                    !_.includes(
                        studentIds,
                        o.desired_activity.activity_application.user_id
                    )
            );

            return (
                <div
                    className={`event event-${
                        this.props.activity.location.label == "Harfleur"
                            ? "harfleur"
                            : "lehavre"
                    } ${activityKind}`}
                >
                    <p>
                        <strong>
                            {this.props.activity.activity_ref.label}
                        </strong>
                        <br />
                        {room.label}
                        {!this.props.displayOnly &&
                        this.props.is_validated &&
                        students.length == 0 ? (
                            <button onClick={e => this.handleDelete(e)}>
                                <i className="fas  fa-times-circle" />
                            </button>
                        ) : null}
                    </p>

                    {(this.props.isTeacher || this.props.isAdmin) &&
                    !this.props.showTeacher ? (
                        <p>
                            <span
                                style={
                                    options.length != 0 ? styleOptions : null
                                }
                            >
                                {students.length + options.length}
                            </span>
                            /{" "}
                            {this.props.activity.activity_ref.occupation_limit}
                            {levelAndAge}
                        </p>
                    ) : (
                        teacherName
                    )}
                </div>
            );
        }

        return (
            <div
                className={`event event-${this.props.kind} ${
                    this.props.is_validated ? "event-validated" : null
                }`}
            >
                <p>{label}</p>
                {!this.props.displayOnly && !this.props.is_validated ? (
                    <button onClick={e => this.handleClick(e)}>
                        <i className="fas  fa-times-circle" />
                    </button>
                ) : null}
            </div>
        );
    }
}

export default TimeInterval;
