import React from "react";
import _ from "lodash";
import Question, { checkCondition } from "./question";

export function filterQuestionsByCondition(questions, answers) {
    return questions
        .filter(q => 
            !q.condition ||
            checkCondition(q.condition, questions, answers)
        );
}

export function checkRequiredQuestions(questions, answers) {
    const requiredQuestions = questions
        .filter(q => q.is_required)
        .map(q => q.id.toString());

    return _.isEqual(
        _.sortBy(
            Object
                .entries(answers)
                .filter(([questionId, value]) => value && requiredQuestions.includes(questionId))
                .map(([k]) => k)
        ),
        _.sortBy(requiredQuestions),
    );
}

export function validateQuestions(questions, answers) {
    return Object.values(answers).length > 0 && checkRequiredQuestions(
        filterQuestionsByCondition(questions, answers),
        answers,
    );
}

const DEFAULT_SUBMIT_LABEL = "Enregistrer les réponses";

export default class EvaluationForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            answers: {
                ...this.props.answers,
            },
        };
    }

    handleAnswer(questionId, answerValue) {
        const newAnswers = {
            ...this.state.answers,
            [questionId]: answerValue,
        };

        const questionsToDisplay = filterQuestionsByCondition(
            this.props.questions,
            newAnswers
        ).map(q => q.id);

        // Remove answers for questions that
        // are not displayed anymore because their
        // condition isn't met.
        const answers = Object
            .entries(newAnswers)
            .reduce((acc, [qId, v]) => {
                if(questionsToDisplay.includes(parseInt(qId)))
                    return {
                        ...acc,
                        [qId]: v,
                    };
                else
                    return acc;
            }, {});

        if(this.props.onChange)
            this.props.onChange(answers);

        this.setState({
            answers,
        });
    }

    render() {
        const {
            referenceData,
            submitLabel,
            questions,
            className,
            readOnly,
            onSubmit,
        } = this.props;

        const {
            answers,
        } = this.state;

        const questionsToDisplay = filterQuestionsByCondition(questions, answers);

        const areAllQuestionsAnswered = checkRequiredQuestions(questionsToDisplay, answers);        

        const renderedQuestions = _(questionsToDisplay)
            .sortBy("order")
            .map((q, i) => <div key={q.id}>
                {!!i && <div className="hr-line-dashed"></div>}
                <Question
                    question={q}
                    answer={answers[q.id]}
                    referenceData={referenceData}
                    readOnly={readOnly}
                    onChange={v => this.handleAnswer(q.id, v)} />
            </div>)
            .value();

        return <div className={className + " flex-column"}>
            {renderedQuestions}
            {
                readOnly || !onSubmit || <button
                    className="btn btn-primary"
                    style={{ alignSelf: "end" }}
                    disabled={!areAllQuestionsAnswered}
                    onClick={() => onSubmit(answers)}>
                    {submitLabel || DEFAULT_SUBMIT_LABEL}
                </button>
            }
        </div>;
    }
}