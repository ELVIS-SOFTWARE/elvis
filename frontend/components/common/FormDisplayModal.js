import React from "react";
import Modal from "react-modal";
import EvaluationForm from "../evaluation/EvaluationForm";

export default function QuestionnaireModal({
    header = <h1>Questionnaire :</h1>,
    isOpen = false,
    loading = false,
    className = "col-lg-4 col-xs-12",
    onRequestClose,
    ...formProps
}) {
    return <Modal
        isOpen={isOpen}
        className={className}
        ariaHideApp={false}
        onRequestClose={onRequestClose}>
        <div className="loader-wrap">
            {loading && <div className="loader">Chargement de la fiche...</div>}
            <div className={"ibox " + (loading ? "loading" : "")}>
                {header}
                <div className="ibox-content">
                    {loading || <EvaluationForm {...formProps} />}
                </div>
            </div>
            <div className="ibox-footer flex flex-space-between-justified m-t">
                <button
                    className="btn"
                    style={{marginRight: "auto"}}
                    type="button"
                    onClick={onRequestClose}>
                    <i className="fas fa-times m-r-sm"></i>
                    Fermer
                </button>
            </div>
        </div>
    </Modal>
}