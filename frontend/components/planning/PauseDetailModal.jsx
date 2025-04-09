import React from "react";

const PauseDetailModal = ({
                              pauseInterval,
                              closeModal,
                              onDelete,
                              onEdit,
                          }) => {
    if (!pauseInterval) return null;

    // Formater les dates
    const startDate = pauseInterval.start ? pauseInterval.start.toLocaleString() : "Non défini";
    const endDate = pauseInterval.end ? pauseInterval.end.toLocaleString() : "Non défini";

    return (
        <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Détail de la pause</h2>

            <div className="mb-4">
                <p><strong>Début :</strong> {startDate}</p>
                <p><strong>Fin :</strong> {endDate}</p>
                {pauseInterval.recurrenceRule && (
                    <p><strong>Récurrence :</strong> {pauseInterval.recurrenceRule}</p>
                )}
            </div>

            <div className="flex justify-end space-x-2">
                <button
                    onClick={() => onEdit(pauseInterval)}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                >
                    Modifier
                </button>

                <button
                    onClick={() => onDelete(pauseInterval)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                >
                    Supprimer
                </button>

                <button
                    onClick={closeModal}
                    className="bg-gray-300 text-gray-700 px-3 py-1 rounded"
                >
                    Fermer
                </button>
            </div>
        </div>
    );
};


export default PauseDetailModal;
