import React, { Fragment } from "react";
import CollapsePanel from "../utils/ui/collapse_panel";
import EvaluationForm from "./EvaluationForm";
import * as api from "../../tools/api";
import { fullname } from "../../tools/format";
import _ from "lodash";

function renderEvaluationHeader(user, season, activity, hasAnswered, collapsed) {
    const level = user.levels.find(l =>
        l.activity_ref_id === activity.activity_ref_id &&
        l.season_id === season.id
    );

    const levelStr = level && level.evaluation_level_ref && `NIVEAU ${level.evaluation_level_ref.label}`;

    return (
        <Fragment>
            {hasAnswered ? (
                <span className="label label-success m-l-xs pull-right">
                    {levelStr || ""}
                </span>
            ) : (
                <span className="label label-warning m-l-xs pull-right">
                    {"A évaluer"}
                </span>
            )}

            {hasAnswered && (
                <span className="m-r-sm">
                    <i className="fas fa-check text-success font-bold" />
                </span>
            )}

            <span>{fullname(user)}</span>
        </Fragment>
    );
}

export function getAnswersObject(dbAnswers) {
    return dbAnswers.reduce((acc, a) => ({
        ...acc,
        [a.question_id]: a.value,
    }), {});
}

/**
 * A wrapper component which lists an activity's students.
 * Each student panel is selectable, and when it is selected it expands
 * to display an evaluation form (collapse and expand using bootstrap classes).
 * The component manages the submitting of the forms, too.
 */
class Evaluation extends React.Component {
    constructor(props) {
        super(props);

        const studentAnswers = this.props.evaluations.reduce((acc, evaluation) => ({
            ...acc,
            [evaluation.student_id]: getAnswersObject(evaluation.answers),
        }), {})

        this.state = {
            students: _.mapKeys(this.props.activity.users, "id"),
            currentStudent: null,
            studentAnswers,
        };
    }

    handleSetCurrentStudent(id) {
        const currentStudent = this.state.currentStudent === id ? null : id;

        this.setState({
            currentStudent,
        });
    }

    handleSubmit(answers) {


        api.set()
            .success(data => {
                this.setState({
                    students: {
                        ...this.state.students,
                        [data.student.id]: {
                            ...this.state.students[data.student.id],
                            levels: data.student.levels
                        }
                    },
                    studentAnswers: {
                        ...this.state.studentAnswers,
                        [data.student.id]: getAnswersObject(data.evaluation.answers),
                    },
                    currentStudent: null,
                })
            })
            .post(
                "/student_evaluations",
                {
                    season_id: this.props.season.id,
                    teacher_id: this.props.user.id,
                    student_id: this.state.currentStudent,
                    activity_id: this.props.activity.id,
                    answers,
                }
            );
    }

    render() {
        const {
            season,
            activity,
            questions,
            referenceData,
        } = this.props;

        const {
            students,
            studentAnswers,
            currentStudent,
        } = this.state;

        const studentsPanels = _.map(students, u => {
            const hasAnswered = studentAnswers[u.id];

            const previousSeasonLevel = u.levels // cas spécial, certains niveaux ont un id season à null à la place de 1
                .find(l => (
                    l.season_id == season.previous.id || (l.season_id == undefined)
                )
                    && l.activity_ref && l.activity_ref.activity_ref_kind_id == activity.activity_ref.activity_ref_kind_id);
            return (
                <CollapsePanel
                    key={u.id}
                    className="panel-default"
                    header={renderEvaluationHeader(u, season, activity, hasAnswered, currentStudent !== u.id)}
                    onClick={() => this.handleSetCurrentStudent(u.id)}
                    collapsed={currentStudent !== u.id}
                >
                    <div className="p">
                        <span className={`label label-${previousSeasonLevel ? "info" : "danger"}`}>
                            {
                                (previousSeasonLevel ?
                                    `Niveau ${previousSeasonLevel.evaluation_level_ref.label} pour ${activity.activity_ref.activity_ref_kind.name} en ${season.previous.label}`
                                    :
                                    `Pas de niveau trouvé pour ${activity.activity_ref.activity_ref_kind.name} en ${season.previous.label}`).toUpperCase()
                            }
                        </span>
                    </div>
                    <EvaluationForm
                        className="p"
                        key={u.id}
                        user={u}
                        questions={questions}
                        answers={currentStudent && studentAnswers[currentStudent] || {}}
                        referenceData={referenceData}
                        onSubmit={answers => this.handleSubmit(answers)}
                    />
                </CollapsePanel>
            );
        });

        return <React.Fragment>
            {studentsPanels}
        </React.Fragment>;
    }
}

export default Evaluation;