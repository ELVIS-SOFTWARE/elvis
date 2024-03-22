import React from "react";

function renderActivityAction(actionLabel) {
    switch (actionLabel) {
        case "Proposition acceptée":
            return (
                <React.Fragment>
                    <i className="fas fa-lg fa-check-circle color-green" />
                    <span className="label label-primary bg-green">
                        Proposition acceptée
                    </span>
                </React.Fragment>
            );
        case "Cours proposé":
            return (
                <React.Fragment>
                    <i className="fas fa-lg fa-info-circle color-green" />
                    <span className="label label-primary bg-green">
                        Cours proposé
                    </span>
                </React.Fragment>
            );
        case "Proposition refusée":
            return (
                <React.Fragment>
                    <i className="fas fa-lg fa-times-circle" style={{color:"#ED5565"}} />
                    <span className="label label-danger bg-danger">
                        Proposition refusée
                    </span>
                </React.Fragment>
            );
        case "Traitée":
            return (
                <React.Fragment>
                    <i className="fas fa-lg fa-check-circle color-green" />
                    <span className="label label-primary bg-green">
                        Cours attribué
                    </span>
                </React.Fragment>
            );
        case "En traitement":
            return (
                <React.Fragment>
                    <i className="fas fa-check-circle text-info" />
                    <span className="label label-info">En traitement</span>
                </React.Fragment>
            );
        case "Arrêt":
            return (
                <React.Fragment>
                    <i className="fas  fa-times-circle fa-lg bg-danger img-circle mt-0 mb-2 p-1" />
                    <span className="label label-danger">Arrêt</span>
                </React.Fragment>
            );
        case "Current":
            return (
                <React.Fragment>
                    <i className="fas fa-check-circle text-secondary" />
                    <span className="label label-default">Cours actuel</span>
                </React.Fragment>
            );
        case "En cours de traitement":
            return (
                <React.Fragment>
                    <i className="fas mt-4 fa-hourglass fa-sm bg-warning img-circle"
                       style={{ padding: "1px 6px 1px 6px" }} />
                    <span className="label label-warning mt-1">En cours de traitement</span>
                </React.Fragment>
            );
        default:
            return (
                <React.Fragment>
                    <i className="fas m-0 fa-hourglass fa-sm bg-warning img-circle"
                       style={{ padding: "1px 6px 1px 6px" }} />
                    <span className="label label-warning mt-1">En attente de traitement</span>
                </React.Fragment>
            );
    }
}

export default renderActivityAction;