import React from "react";
import _ from "lodash";
import EvaluationForm, { validateQuestions } from "../evaluation/EvaluationForm";
import { toast } from "react-toastify";

class Evaluation extends React.Component {
    constructor(props) {
        super(props);

        const answers = this.props.refsToEvaluate.reduce((acc, ref) => ({
            ...acc,
            [ref.id]: {
                ...this.props.answers[ref.id] || {},
            },
        }), {});

        this.state = {
            answers,
            selectedRef: this.props.refsToEvaluate[0].id,
        };
    }

    isValidated() {
        const { questions } = this.props;
        const { answers } = this.state;

        const areAllQuestionsAnswered = Object.values(answers).length > 0 &&
            Object.values(answers)
                .reduce((acc, answers) => acc && validateQuestions(
                    questions,
                    answers,
                ), true);

        if (!areAllQuestionsAnswered)
            toast("Veuillez répondre au.x questionnaire.s", {
                autoClose: 3000,
                type: "error",
            });

        return areAllQuestionsAnswered;
    }

    onAnswersChange(answers) {
        const { selectedRef } = this.state;

        const newAnswers = {
            ...this.state.answers,
            [selectedRef]: answers,
        };

        this.props.onChange(newAnswers);

        this.setState({
            answers: newAnswers,
        });
    }

    handleTabChange(selectedRef) {
        this.setState({
            selectedRef,
        });
    }

    render() {
        const { refsToEvaluate, questions, } = this.props;
        const { selectedRef, answers, } = this.state;

        const validatedTabs = refsToEvaluate.reduce((acc, {id}) => ({
            ...acc,
            [id]: validateQuestions(
                questions,
                answers[id] || {},
            ),
        }), {});

        const tabs = refsToEvaluate.map((r, i) => {
            const refId = r.id;

            return (
                <button
                    key={i}
                    className={`btn btn-xs m-b-sm m-r-sm ${
                        refId === selectedRef ? "btn-primary" : "btn-secondary"
                        }`}
                    onClick={() => this.handleTabChange(refId)}>
                    {r.kind} {validatedTabs[refId] && " ✓"}
                </button>
            );
        });

        return <div>
            <div className="flex" style={{ flexWrap: "wrap" }}>
                {tabs}
            </div>
            <EvaluationForm
                className="ibox-content"
                key={selectedRef}
                questions={this.props.questions}
                onChange={answers => this.onAnswersChange(answers)}
                answers={answers[selectedRef] || {}} />
        </div>;
    }
}

export default Evaluation;
