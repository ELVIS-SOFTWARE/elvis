import React from "react";

export default function RoomActivitiesListModal({room, refs}) {
    return <div className="modal" id="room-activities-modal">
        <div className="modal-dialog">
            <div className="modal-content">
                <div className="flex flex-space-between-justified p">
                    <h3 className="modal-title">Activités de la salle {room.label}</h3>
                    <button type="button" style={{fontSize: "2em"}} className="close" data-dismiss="modal" aria-label="Fermer">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <hr/>
                <div className="modal-body">
                    <ul>
                        {refs.map(r => <li key={r.id}>
                            {r.label}
                        </li>)}
                    </ul>
                </div>
            </div>
        </div>
    </div>;
}