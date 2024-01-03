import React, { Fragment } from "react";
import { array, bool, object } from "prop-types";
import _ from "lodash";

import * as TimeIntervalHelpers from "./TimeIntervalHelpers.js";
import {
    fullnameWithAge,
    fullname,
    toDate,
    toHourMin,
} from "../../tools/format.js";
import { WEEKDAYS } from "../../tools/constants";

const levelDisplay = (users, activityRefId, timeInterval, seasons) => {
    const season = TimeIntervalHelpers.getSeasonFromDate(
        timeInterval.start,
        seasons
    );

    return TimeIntervalHelpers.levelDisplay(
        users,
        activityRefId,
        season ? season.id : 0
    );
};

const StudendItems = ({ students }) => {
    return (
        <Fragment>
            {_.map(students, u => (
                <li key={u.id} className="list-group-item no-borders">
                    <a className="taureau" href={`/users/${u.id}`}>
                        {fullnameWithAge(u)}
                    </a>
                </li>
            ))}
        </Fragment>
    );
};

const OptionItems = ({ options, color }) => {
    return (
        <Fragment>
            {_.map(options, opt => (
                <li key={opt.desired_activity.activity_application.user.id}  className="list-group-item no-borders">
                    <a
                        className="taureau"
                        href={`/users/${opt.desired_activity.activity_application.user.id}`}
                        style={{ color: color }}
                    >
                        {fullnameWithAge(
                            opt.desired_activity.activity_application.user
                        )} (option)
                    </a>
                </li>
            ))}
        </Fragment>
    );
};

const RawActivity = ({ timeInterval, isTeacher, seasons }) => {
    // Vars
    const activity =
        timeInterval.activity || timeInterval.activity_instance.activity;

    const inactiveIds =
        timeInterval.activity_instance &&
        Array.isArray(timeInterval.activity_instance.inactive_students)
            ? timeInterval.activity_instance.inactive_students.map(s => s.id)
            : [];

    const students = activity.users.filter(u => !inactiveIds.includes(u.id));

    const studentIds = _.map(activity.users, u => u.id);

    const options = _.filter(
        activity.options,
        o =>
            !_.includes(
                studentIds,
                o.desired_activity.activity_application.user.id
            )
    );

    const teacher = activity.teacher || {
        first_name: "",
        last_name: "",
    };

    // Render
    return (
        <div className="raw-activity">
            <div className="ibox">
                <div className="ibox-title">
                    <h4>{activity.group_name || null}</h4>
                </div>

                <div className="ibox-content p-xs">
                    <h5 className="text-danger">
                        {toHourMin(toDate(timeInterval.start))} -{" "}
                        {toHourMin(toDate(timeInterval.end))}{" "}
                        {activity.activity_ref.label}{" "}
                        {isTeacher ? activity.room.label : null}
                    </h5>

                    {isTeacher ? null : <p>{fullname(teacher)}</p>}

                    <p className="font-bold font-italic">
                        {students.length + options.length}/
                        {activity.activity_ref.occupation_limit} élèves -{" "}
                        {levelDisplay(
                            students,
                            activity.activity_ref_id,
                            timeInterval,
                            seasons
                        )}
                    </p>

                    <ul className="list-group">
                        <StudendItems students={students} />
                        <OptionItems options={options} color={'purple'} />
                    </ul>
                </div>
            </div>
        </div>
    );
};

class RawPlanning extends React.Component {
    constructor(props) {
        super(props);
        // console.log(props)
    }

    renderDayColumns(tis) {
        const { isTeacher, seasons } = this.props;
        return Array.isArray(tis) && tis.length
            ? tis
                  .sort((a, b) => toDate(a.start) - toDate(b.start))
                  .reduce((comps, ti) => {
                      if (ti.is_validated && ti.kind !== "e") {
                          comps.push(
                              <RawActivity
                                  key={ti.id}
                                  timeInterval={ti}
                                  seasons={seasons}
                                  isTeacher={isTeacher}
                              />
                          );
                      }

                      return comps;
                  }, [])
            : null;
    }

    render() {
        const { data } = this.props;
        const sortedData = Object.keys(data).sort();
        sortedData.push(sortedData.shift()); // Dimanche en dernier jour

        return (
            <div className="m-t-sm">
                <div>
                    <div className="flex">
                        {sortedData.length == 0 ? (
                            <p className="p-sm lead">
                                {"Aucune activité cette semaine."}
                            </p>
                        ) : null}
                    </div>

                    <div className="row m-t-sm">
                        {sortedData.map(day => (
                            <div
                                key={day}
                                className="col-lg-2 col-md-3 col-sm-6 col-xs-12"
                            >
                                <h4 className="text-center bg-primary p-xs sticked">
                                    {WEEKDAYS[day]}
                                </h4>

                                {this.renderDayColumns(data[day])}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
}

RawPlanning.propTypes = {
    data: object,
    isTeacher: bool,
    seasons: array,
};

export default RawPlanning;
