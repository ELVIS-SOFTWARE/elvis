import React, { Component, Fragment } from "react";
import Modal from "react-modal";
import moment from "moment";
import { toast } from "react-toastify";
import { toAge, fullname, displayLevel, formatIntervalHours, fullnameWithAge, toDate } from "../tools/format";
import { set as RequestBuilder } from "../tools/api";
import { getAnswersObject } from "./evaluation/Evaluation";
import QuestionnaireModal from "./common/FormDisplayModal";
import { findAndGet, optionMapper } from "./utils";

const weekdayLocalizer = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
});

const compareTimeIntervals = (a, b) => { 
    const startA = toDate(a.activity.time_interval.start);
    const startB = toDate(b.activity.time_interval.start);

    if (startA < startB) {
        return -1;
    }

    if (startA > startB) {
        return 1;
    }

    return 0;
};

const SelectLevel = ({ activity, evaluationLevelRefs, handleUpdateActivity }) => {
    return (
        <select
        className="form-control"
        value={activity.next_season_evaluation_level_ref_id || ""}
        onChange={e => handleUpdateActivity({
            ...activity,
            next_season_evaluation_level_ref_id: e.target.value && parseInt(e.target.value) || null,
        })}
        >
            <option value="">NIVEAU GLOBAL REQUIS</option>
            {evaluationLevelRefs.map(optionMapper())}
        </select>
    );
};

export default class PrevisionalGroups extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            isModalOpen: false,
            referenceData: null,
            studentEvaluation: null,
            activities: props.activities,
        };
    }

    handleSelectEvaluation(studentEvaluationId) {
        if(_.get(this.state.studentEvaluation, "id") === studentEvaluationId) {
            this.setState({
                isModalOpen: true,
            });
            return;
        }

        RequestBuilder()
            .before(() => this.setState({
                isModalOpen: true,
                loading: true,
            }))
            .success(
                ({
                    student_evaluation: studentEvaluation,
                    reference_data: referenceData
                }) => this.setState({
                    loading: false,
                    studentEvaluation,
                    referenceData,
                })
            )
            .error(toast.error)
            .get(`/student_evaluations/${studentEvaluationId}`, {});
    }

    handleUpdateActivity(activity) {
        const {
            activities,
        } = this.state;

        RequestBuilder()
            .success(() => {
                const indexedActivities = _.keyBy(activities, "id");

                indexedActivities[activity.id] = {
                    ...activity,
                };

                this.setState({
                    activities: Object.values(indexedActivities),
                });
            })
            .error(toast.error)
            .post(`/activity/${activity.id}`, {
                activity: { ...activity },
            });
    }

    render() {
        const {
            season,
            students,
            questions,
            evaluation_level_refs,
            pursue_answers,
            changes,
            activities_students: activitiesStudents,
        } = this.props;

        const {
            loading,
            activities,
            isModalOpen,
            studentEvaluation,
            referenceData,
        } = this.state;

        const disparateActivities = [];

        console.log(this.props)

        const groupedPrevisionalActivities = _(Object.entries(activitiesStudents))
            .groupBy(([activityId]) => {
                const activity = activities.find(a => a.id === parseInt(activityId));
                return moment(activity.time_interval.start).isoWeekday();
            })
            .map((activitiesStudents, wday) => {
                const previsionalActivities = activitiesStudents.map(([activityId, studentsEvaluations]) => {
                    const studentIds = Object.keys(studentsEvaluations).map(id => parseInt(id));
                    const activityStudents = students.filter(s => studentIds.includes(s.id));
                    const activity = activities.find(a => a.id === parseInt(activityId));

                    const activityStudentsLevelsIds = activityStudents.map(s =>
                        findAndGet(
                            s.levels,
                            s => s.activity_ref_id === activity.activity_ref_id && s.season_id === season.id,
                            "evaluation_level_ref_id",
                        )
                    );

                    const isDisparate = _.uniq(activityStudentsLevelsIds).length > 1;

                    // A disparity has been detected, add the activity and its
                    // students to disparate activities list
                    if(activity.next_season_evaluation_level_ref_id === null && isDisparate) {
                        disparateActivities.push({
                            ...activity,
                            students: activityStudents,
                        });
                    }

                    return {
                        activity,
                        activityStudents,
                        isDisparate,
                        studentsEvaluations
                    };
                });

                previsionalActivities.sort(compareTimeIntervals);

                const activityList = previsionalActivities.map(pa => (
                    <PrevisionalActivity
                        season={season}
                        key={pa.activity.id}
                        activity={pa.activity}
                        changes={changes[pa.activity.id] || {}}
                        isDisparate={pa.isDisparate}
                        students={pa.activityStudents}
                        studentsEvaluations={pa.studentsEvaluations}
                        pursueAnswers={pursue_answers[pa.activity.id]}
                        evaluationLevelRefs={evaluation_level_refs}
                        handleSelectEvaluation={id => this.handleSelectEvaluation(id)}
                        handleUpdateActivity={activity => this.handleUpdateActivity(activity)} 
                    />
                ));

                return <div className="col-xs-12 col-md-4" key={wday}>
                    <h4 className="text-center bg-primary p-xs sticked">
                        {weekdayLocalizer.format(moment().isoWeekday(parseInt(wday)).toDate())}
                    </h4>
                    {activityList}
                </div>;
            })
            .value();

        return <div>
            <div className="row flex flex-wrap">
                {groupedPrevisionalActivities}
            </div>
            {!this.props.current_user.is_admin && <DisparitiesModal
                season={season}
                activities={disparateActivities}
                evaluationLevelRefs={evaluation_level_refs}
                handleUpdateActivity={activity => this.handleUpdateActivity(activity)}
            />}
            <QuestionnaireModal
                isOpen={isModalOpen}
                loading={loading}
                onRequestClose={() => this.setState({isModalOpen: false})}
                header={<h1><strong>Fiche d'évaluation</strong></h1>}
                // Form pass through props
                readOnly
                questions={questions}
                referenceData={referenceData}
                answers={studentEvaluation && getAnswersObject(studentEvaluation.answers)}
            />
        </div>
    }
}

const DisparitiesModal = ({
    activities,
    season,
    handleUpdateActivity,
    evaluationLevelRefs
}) => {
    const previsionalActivities = activities.map((a, i) => (
        <li key={i} className="list-group-item">
            <div className="p-xs">
                <span className="label label-primary m-r-sm">{a.group_name}</span>
                <span className="font-bold m-r-sm">{formatIntervalHours(a.time_interval)}</span>
                <span>{a.activity_ref.label}</span>
            </div>

            <div className="border-top p-h-xs m-t-sm border-bottom m-b-sm">
                {a.students.map(student => (
                    <div key={student.id}>{fullnameWithAge(student)}{", "}{displayLevel(student, a.activity_ref_id, season.id)}</div>
                ))}
            </div>

            <div>
                <SelectLevel
                    activity={a}
                    handleUpdateActivity={handleUpdateActivity}
                    evaluationLevelRefs={evaluationLevelRefs}
                />
            </div>
        </li>
    ));

    return (
        <Modal
            className="col-xs-12 col-lg-6"
            isOpen={activities.length !== 0}
            ariaHideApp={false}>
            <h1>Une action est requise de votre part</h1>
            <h2 className="text-danger">Veuillez attribuer un niveau pour les cours suivants</h2>
            <ul className="list-group">
                {previsionalActivities}
            </ul>
        </Modal>
    );
}

function PrevisionalActivity({
    evaluationLevelRefs,
    season,
    activity,
    students,
    pursueAnswers,
    changes,
    isDisparate,
    studentsEvaluations,
    handleSelectEvaluation,
    handleUpdateActivity
}) {
    const studentsList = students.map(s => {
        let pursueStyle = "";
        if (pursueAnswers.no.includes(s.id)) {
            pursueStyle = "font-strike";
        } else if (pursueAnswers.maybe.includes(s.id)) {
            pursueStyle = "font-underlined";
        }

        let changeStyle = "";
        let changeAnswer = null;
        if (changes[s.id]) {
            changeStyle = changes[s.id].informed ? "change-informed" : "change-uninformed";
            changeAnswer = changes[s.id].groups;
        }

        return (
            <button 
                type="button"
                className={`list-group-item ${changeStyle} student-item`}
                key={s.id}
                onClick={() => handleSelectEvaluation(studentsEvaluations[s.id])}
            >
                <span className={`font-bold ${pursueStyle}`}>
                    {fullname(s)}
                </span>
                <span className={`${pursueStyle}`}>
                    {toAge(s.birthday)}
                </span>
                <span className={`${pursueStyle}`}>
                    {displayLevel(s, activity.activity_ref_id, season.id)}
                </span>
                {changeAnswer ? (
                    <span className="font-bold">{changeAnswer}</span>
                ) : null}
            </button>
        );
    });

    let activityLevel = null;
    
    if(!isDisparate) {
        if(activity.next_season_evaluation_level_ref_id)
            activityLevel = findAndGet(
                evaluationLevelRefs,
                r => r.id === activity.next_season_evaluation_level_ref_id,
                "label"
            );
        else
            activityLevel = findAndGet(
                _.get(students ,"[0].levels"),
                l => l.activity_ref_id === activity.activity_ref_id && l.season_id === season.id,
                "evaluation_level_ref.label"
            ) || "PAS DE NIVEAU";
    }

    return <div className="ibox">
        <div className="ibox-title">
            <h4>
                <span>{formatIntervalHours(activity.time_interval)}</span>
                {activityLevel ? (
                    <span className="label label-success pull-right">
                        {activityLevel}
                    </span>
                ) : null}
                {activity.group_name ? (
                    <span
                        className="label label-primary pull-right"
                    >
                        {activity.group_name}
                    </span>
                ) : null}
            </h4>
        </div>
        <div className="ibox-content">
            <p className="font-bold">
                {activity.activity_ref.label}
            </p>

            <ul className="list-group">
                {studentsList}
            </ul>

            {isDisparate ? (
                <Fragment>
                    <hr />

                    <div>
                        <div>
                            <label>
                                {"Affecter un niveau global"}
                            </label>
                            <span className="pull-right text-warning">
                                <i className="fas fa-exclamation-triangle" />
                            </span>
                        </div>

                        <SelectLevel
                            activity={activity}
                            handleUpdateActivity={handleUpdateActivity}
                            evaluationLevelRefs={evaluationLevelRefs}
                        />
                    </div>
                </Fragment>
            ) : null}
        </div>
    </div>;
}