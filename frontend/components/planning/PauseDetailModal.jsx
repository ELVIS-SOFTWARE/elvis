import React from "react";
import moment from "moment";

const PauseDetailModal = ({
                              pauseInterval,
                              closeModal,
                              onDelete,
                          }) => {
    if (!pauseInterval) {
        if (closeModal) {
            setTimeout(() => closeModal(), 0);
        }
        return null;
    }


    const formatTimeIfValid = (dateValue) => {
        try {
            if (dateValue && moment(dateValue).isValid()) {
                return moment(dateValue).format("HH[h]mm");
            }
            return "Non défini";
        } catch (error) {
            console.error("Erreur de formatage de date:", error);
            return "Non défini";
        }
    };

    const startTime = formatTimeIfValid(pauseInterval.start);
    const endTime = formatTimeIfValid(pauseInterval.end);

    return (
        <div>
            <h3>Détail de la pause</h3>
            <hr/>

            <p>
                Début : <b>{startTime}</b><br/>
                Fin : <b>{endTime}</b>
            </p>

            {pauseInterval.comment && (
                <div className="alert alert-info">
                    <strong>Commentaire</strong><br/>
                    {pauseInterval.comment.content}
                </div>
            )}

            <hr/>

            <div className="flex flex-space-between-justified">
                <button className="btn" onClick={closeModal} type="button">
                    <i className="fas fa-times m-r-sm"/>
                    Fermer
                </button>

                {pauseInterval.id && (
                    <button
                        className="btn btn-warning"
                        onClick={() => {
                            onDelete(pauseInterval.id);
                        }}
                        type="button"
                    >
                        <i className="fas fa-trash m-r-sm" />
                        Supprimer la pause
                    </button>
                )}
            </div>
        </div>
    );
};

export default PauseDetailModal;