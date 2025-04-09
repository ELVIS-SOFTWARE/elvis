import React from "react";

const PauseDetailModal = ({
                              pauseInterval,
                              closeModal,
                              onDelete,
                              onEdit,
                          }) => {
    if (!pauseInterval) {
        console.error("Aucun intervalle de pause fourni");
        return null;
    }

    // Vérification des propriétés start et end pour voir leur contenu
    console.log("Pause Interval:", pauseInterval);

    const start = pauseEvent.start.toDate ? pauseEvent.start.toDate() : pauseEvent.start;
    const end = pauseEvent.end.toDate ? pauseEvent.end.toDate() : pauseEvent.end;
    console.log(pauseEvent.start, pauseEvent.start instanceof Date)
    console.log(pauseEvent.end, pauseEvent.end instanceof Date)


    let startDate = "Non défini";
    let endDate = "Non défini";

    // Assurer que start et end sont des objets Date valides
    if (pauseInterval.start && pauseInterval.start instanceof Date && !isNaN(pauseInterval.start)) {
        startDate = pauseInterval.start.toLocaleString();
    } else {
        console.error("La date de début est invalide:", pauseInterval.start);
    }

    if (pauseInterval.end && pauseInterval.end instanceof Date && !isNaN(pauseInterval.end)) {
        endDate = pauseInterval.end.toLocaleString();
    } else {
        console.error("La date de fin est invalide:", pauseInterval.end);
    }

    return (
        <div>
            <h3>Détail de la pause</h3>
            <hr/>

            <p>
                Début : <b>{moment(this.props.interval.start).format("HH[h]mm")}</b><br/>
                Fin : <b>{moment(this.props.interval.end).format("HH[h]mm")}</b>
            </p>

            {this.props.interval.comment && (
                <div className="alert alert-info">
                    <strong>Commentaire</strong><br/>
                    {this.props.interval.comment.content}
                </div>
            )}

            <hr/>

            <div className="flex flex-space-between-justified">
                <button className="btn" onClick={this.props.closeModal} type="button">
                    <i className="fas fa-times m-r-sm"/>
                    Fermer
                </button>

                <button
                    className="btn btn-warning"
                    onClick={() => this.props.handleDeleteInterval(this.props.interval.id)}
                    type="button"
                >
                    <i className="fas fa-trash m-r-sm"/>
                    Supprimer la pause
                </button>
            </div>
        </div>
    );
};

export default PauseDetailModal;
