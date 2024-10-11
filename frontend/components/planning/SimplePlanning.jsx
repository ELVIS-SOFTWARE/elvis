import React, { Fragment } from "react";
import { array, object } from "prop-types";
import moment from "moment";
import _ from "lodash";

import * as TimeIntervalHelpers from "./TimeIntervalHelpers";
import {
    fullnameWithAge,
    fullname,
    toDate,
    toHourMin,
    toLocaleDate,
} from "../../tools/format.js";
import * as api from "../../tools/api";
import { WEEKDAYS, INTERVAL_KINDS } from "../../tools/constants";
import { makeDebounce } from "../../tools/inputs";
import KindLegend from "../common/KindLegend";
import QuestionnaireModal from "./QuestionnaireModal";
import SelectTeachers from "./SelectTeachers";

const debounce = makeDebounce();
const debounceModal = makeDebounce();

const StudentItems = ({ students, selectedPlanning, currentPlanning }) => {
    let displayStudents;

    if (selectedPlanning !== null && currentPlanning !== selectedPlanning)
    {
        displayStudents  =
            <Fragment>
                {_.map(students, u => (
                    <li key={u.id} className="list-group-item no-borders">
                        {fullnameWithAge(u)}
                    </li>
                ))}
            </Fragment>
    }
    else
    {
        displayStudents =
            <Fragment>
                {_.map(students, u => (
                    <li key={u.id} className="list-group-item no-borders">
                        <a href={`/users/${u.id}`}>{fullnameWithAge(u)}</a>
                    </li>
                ))}
            </Fragment>
    }
    return displayStudents;

};

const OptionItems = ({ options , selectedPlanning, currentPlanning }) => {
    let displayOptions;

    if (selectedPlanning !== null && currentPlanning !== selectedPlanning)
    {
        displayOptions  =
            <Fragment>
                {_.map(options, u => (
                    <li className="list-group-item no-borders" key={u.id}>
                        <span className="option-student">
                            {fullnameWithAge(u)}
                        </span>
                    </li>
                ))}
            </Fragment>
    }
    else {
        displayOptions =
            <Fragment>
                {_.map(options, u => (
                    <li className="list-group-item no-borders" key={u.id}>
                        <a href={`/users/${u.id}`}>
                        <span className="option-student">
                            {fullnameWithAge(u)}
                        </span>
                        </a>
                    </li>
                ))}
            </Fragment>
    }
    return displayOptions;

};

const SimpleActivity = ({ timeInterval, seasons, selectedPlanning, currentPlanning }) => {
    if (!timeInterval.activity_instance) {
        return null;
    }

    // Vars
    const activity = timeInterval.activity_instance.activity;

    const students = timeInterval.students.active;

    const options = timeInterval.students.options;
    // Render
    return (
        <div className="raw-activity">
            <div className="ibox">
                <div
                    className={`ibox-title border-kind border-kind-${timeInterval.kind}`}
                >
                    <h4>
                        {toHourMin(toDate(timeInterval.start))}
                        {" - "}
                        {toHourMin(toDate(timeInterval.end))}
                        {activity.group_name ? (
                            <span
                                className={`label bg-kind-${timeInterval.kind} text-white pull-right`}
                            >
                                {activity.group_name}
                            </span>
                        ) : null}
                    </h4>
                </div>

                <div className="ibox-content p-xs">
                    <p className="font-bold">{activity.activity_ref.label}</p>
                    <p>{activity.room.label}</p>

                    <p className="font-bold font-italic">
                        {students.length + options.length}/
                        {activity.activity_ref.occupation_limit}
                        {" élèves "}
                        {TimeIntervalHelpers.levelDisplayForActivity({ ...activity, users: students, time_interval: timeInterval }, seasons)}
                    </p>

                    <ul className="list-group">
                        <StudentItems students={students} selectedPlanning={selectedPlanning} currentPlanning={currentPlanning} />
                        <OptionItems options={options} selectedPlanning={selectedPlanning} currentPlanning={currentPlanning} />
                    </ul>
                </div>
            </div>
        </div>
    );
};

class SimpleEvaluation extends React.PureComponent {
    constructor(props) {
        super(props);
    }

    fetchQuestionnaire() {
        const appointment = this.props.timeInterval.evaluation_appointment;

        if (appointment) {
            this.props.toggleModal();

            debounceModal(() => {
                api.set()
                    .success(
                        ({
                            questions,
                            new_student_level_questionnaire: questionnaire,
                            reference_data: referenceData,
                        }) =>
                            this.props.setQuestionnaire(
                                appointment.student,
                                questions,
                                questionnaire,
                                referenceData
                            )
                    )
                    .get(
                        `/new_student_level_questionnaire/appointment/${appointment.id}`
                    );
            }, 400);
        }
    }

    render() {
        const { timeInterval } = this.props;
        const appointment = timeInterval.evaluation_appointment;

        if (!appointment) {
            return null;
        }

        // Render
        return (
            <div className="raw-activity">
                <div className="ibox">
                    <div
                        className={`ibox-title border-kind border-kind-${timeInterval.kind}`}
                    >
                        <h4>
                            {toHourMin(toDate(timeInterval.start))}
                            {" - "}
                            {toHourMin(toDate(timeInterval.end))}

                            <span className="label bg-kind-e text-white pull-right">
                                {"EVAL"}
                            </span>
                        </h4>
                    </div>

                    <div className="ibox-content p-xs">
                        <p className="font-bold text-primary">
                            {appointment.activity_ref.label}
                        </p>

                        <div className="list-group">
                            <div>{fullname(appointment.student)}</div>
                        </div>

                        <div className="clearfix">
                            <button
                                className="btn btn-default btn-xs btn-block"
                                onClick={() => this.fetchQuestionnaire()}
                            >
                                {"Lire auto-évaluation"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

class SimplePlanning extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            data: this.props.data,
            day: this.props.day,
            evalModalIsOpen: false,
            questions: null,
            questionnaire: null,
            referenceData: null,
            student: null
        };

        this.toggleEvalModal = this.toggleEvalModal.bind(this);
        this.setQuestionnaire = this.setQuestionnaire.bind(this);
    }

    renderDayColumns(tis) {
        const { seasons, selectedPlanning, currentPlanning } = this.props;
        return Array.isArray(tis) && tis.length
            ? tis
                  .sort((a, b) => toDate(a.start) - toDate(b.start))
                  .reduce((comps, ti) => {
                      if (ti.is_validated) {
                          if (ti.kind == INTERVAL_KINDS.EVALUATION) {
                              comps.push(
                                  <SimpleEvaluation
                                      key={ti.id}
                                      timeInterval={ti}
                                      toggleModal={this.toggleEvalModal}
                                      setQuestionnaire={this.setQuestionnaire}
                                  />
                              );
                          } else {
                              comps.push(
                                  <SimpleActivity
                                      key={ti.id}
                                      timeInterval={ti}
                                      seasons={seasons}
                                      selectedPlanning={selectedPlanning}
                                      currentPlanning={currentPlanning}

                                  />
                              );
                          }
                      }

                      return comps;
                  }, [])
            : null;
    }

    changeDate(day) {

        let historyUrl  = `/planning/simple/${day}`
        let intervalUrl = `/planning/simple/intervals/${day}/${this.props.currentPlanning}`

        if(this.props.selectedPlanning !== null && this.props.currentPlanning !== this.props.selectedPlanning)
        {
            historyUrl = `/planning/simple/${day}/${this.props.selectedPlanning}`
            intervalUrl = `/planning/simple/intervals/${day}/${this.props.selectedPlanning}`
        }

        this.setState({ loading: true, day: moment(day) });
        history.pushState({}, null, historyUrl);

        debounce(() => {
            api.set()
                .success(({ data }) => {
                    this.setState({ data, loading: false });
                })
                .get(intervalUrl);
        }, 600);
    }

    setQuestionnaire(student, questions, questionnaire, referenceData) {
        this.setState({
            student,
            questions,
            questionnaire,
            referenceData,
        });
    }

    toggleEvalModal() {
        this.setState({
            evalModalIsOpen: !this.state.evalModalIsOpen,
            questions: null,
            questionnaire: null,
            referenceData: null,
            student: null
        });
    }

    render() {
        const {
            loading,
            data,
            day,
            student,
            questions,
            referenceData,
            questionnaire,
        } = this.state;
        const sortedData = Object.keys(data).sort();
        sortedData.length > 0 ? sortedData.push(sortedData.shift()) : null

        const momentDay = moment(day);
        const weekDay = moment(day).format("YYYY-MM-DD");;

        const endOfWeek = moment(day).add(6, "d");
        const prevWeek = moment(day)
            .subtract(1, "week")
            .format("YYYY-MM-DD");
        const nextWeek = moment(day)
            .add(1, "week")
            .format("YYYY-MM-DD");

        const format =
            momentDay.month() !== endOfWeek.month() ? "DD MMMM" : "DD";
        const displayWeek = `${momentDay.format(format)} - ${endOfWeek.format(
            "DD MMMM YYYY"
        )}`;

        return [
            <SelectTeachers listTeacher={this.props.listTeachers} selectedName={this.props.selectedName}
                           currentUser={this.props.currentPlanning} date={weekDay}/>,
            <div>
                <div className="calendar-header">
                    <div className="calendar-header-group">
                        <div className="date-component">
                            <button
                                className="btn btn-primary"
                                onClick={() => this.changeDate(prevWeek)}
                            >
                                <i className="fas fa-arrow-left" />
                            </button>

                            <h4 className="auto p-sm">{displayWeek}</h4>

                            <button
                                className="btn btn-primary"
                                onClick={() => this.changeDate(nextWeek)}
                            >
                                <i className="fas fa-arrow-right" />
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <KindLegend kinds={["e", "c", "o"]} />
                </div>

                {loading ? (
                    <div>{"Chargement..."}</div>
                ) : (
                    <Fragment>
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
                                        {WEEKDAYS[day]}{" "}
                                        {data[day].length
                                            ? toLocaleDate(
                                                  toDate(data[day][0].start)
                                              )
                                            : null}
                                    </h4>

                                    {this.renderDayColumns(data[day])}
                                </div>
                            ))}
                        </div>
                    </Fragment>
                )}

                <QuestionnaireModal
                    isOpen={this.state.evalModalIsOpen}
                    toggleModal={() => this.toggleEvalModal()}
                    student={student}
                    questions={questions}
                    questionnaire={questionnaire}
                    referenceData={referenceData}
                />
            </div>
        ];
    }
}

SimplePlanning.propTypes = {
    data: object,
    seasons: array,
};

export default SimplePlanning;
