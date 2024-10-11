import React from "react";

function renderActivityAction(actionLabel) {
    switch (actionLabel) {
        case "Proposition acceptée":
            return (
                <React.Fragment>
                    <div className="badge badge-pill badge-success text-white">
                        <i className="fas fa-check-circle mr-2"/>Proposition acceptée
                    </div>
                </React.Fragment>
            );
        case "Cours proposé":
            return (
                <React.Fragment>
                    <div className="badge badge-pill badge-info text-white">
                        <i className="fas fa-info-circle mr-2"/>Cours proposé
                    </div>
                </React.Fragment>
            );
        case "Proposition refusée":
            return (
                <React.Fragment>
                    <div className="badge badge-pill badge-danger text-white">
                        <i className="fas fa-times-circle mr-2"/>Proposition refusée
                    </div>
                </React.Fragment>
            );
        case "Traitée":
            return (
                <React.Fragment>
                    <div className="badge badge-pill badge-success text-white">
                        <i className="fas fa-check-circle mr-2"/>Cours attribué
                    </div>
                </React.Fragment>
            );
        case "En traitement":
            return (
                <React.Fragment>
                    <div className="badge badge-pill badge-secondary text-white" style={{backgroundColor: "#676a6c"}}>
                        <i className="fas fa-hourglass mr-2"/>En attente de traitement
                    </div>
                </React.Fragment>
            );
        case "Arrêt":
            return (
                <React.Fragment>
                    <div className="badge badge-pill badge-danger text-white" style={{backgroundColor: "#ff6f3c"}}>
                    <i className="fas fa-times-circle mr-2"/>Arrêt
                    </div>
                </React.Fragment>
            );
        case "Current":
            return (
                <React.Fragment>
                    <div className="badge badge-pill badge-success text-white">
                        <i className="fas fa-check-circle mr-2"/>Cours actuel
                    </div>
                </React.Fragment>
            );
        case "En cours de traitement":
            return (
                <React.Fragment>
                    <div className="badge badge-pill badge-info text-white" style={{backgroundColor: "#676a6c"}}>
                        <i className="fas fa-hourglass mr-2"/>En cours
                    </div>
                </React.Fragment>
            );
        case "Unsatisfied":
            return (
                <React.Fragment>
                    <div className="badge badge-pill badge-danger text-white">
                        <i className="fas  fa-times-circle mr-2"/>Demande non satisfaite
                    </div>
                </React.Fragment>
            );
        default:
            return (
                <React.Fragment>
                    <div className="badge badge-pill badge-secondary text-white" style={{backgroundColor: "#676a6c"}}>
                        <i className="fas fa-hourglass mr-2"/>En attente de traitement
                    </div>
                </React.Fragment>
            );
    }
}

export default renderActivityAction;