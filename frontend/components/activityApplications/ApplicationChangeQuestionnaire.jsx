import React, { Component } from "react";
import EvaluationForm, { validateQuestions } from "../evaluation/EvaluationForm";
import { toast } from "react-toastify";

export default class ApplicationChangeQuestionnaire extends Component {
    constructor(props) {
        super(props);
    }

    isValidated() {
        const {
            questions,
            answers,
        } = this.props;

        const isValidated = validateQuestions(questions, answers);

        if(!isValidated)
            toast.error("Vous devez répondre aux questions obligatoires de ce questionnaire", {
                autoClose: 3000,
            });

        return isValidated;
    }

    render() {
        const {
            referenceData,
            questions,
            answers,
            onChange,
        } = this.props;

        return <EvaluationForm
            className="ibox-content"
            referenceData={referenceData}
            questions={questions}
            answers={answers}
            onChange={onChange} />;
    }
}