import React from "react";
import { optionMapper, USER_OPTIONS } from "../../utils";

export default function ActivityEdition({
    selection,
    locations,
    rooms,
    teachers,
    onChange,
}) {
    const {
        teacher_id: selectedTeacherId,
        location_id: selectedLocationId,
        room_id: selectedRoomId,
    } = selection;

    return (
        <div>
            <div className="input-group m-b-xs">
                <label>Emplacement</label>
                <select
                    name="location_id"
                    className="form-control"
                    value={selectedLocationId}
                    onChange={({target:{name, value}}) => onChange(name, value)}>
                    {locations.map(optionMapper())}
                </select>
            </div>

            <div className="input-group m-b-sm">
                <label>Salle</label>
                <select
                    name="room_id"
                    className="form-control"
                    value={selectedRoomId}
                    onChange={({target: {name, value}}) => onChange(name, value)}>
                    {rooms
                        .filter(r => r.location.id == selectedLocationId)
                        .map(optionMapper())}
                </select>
            </div>

            <div className="alert alert-warning" style={{width: "500px"}}>
                <b>Attention : </b>Aucune vérification n'est faite lors d'un
                changement de professeur. Le changement de professeur ne sera
                opéré qu'à partir de cette séance, et répercuté sur toutes celles
                la suivant.
            </div>
            {selectedTeacherId ? (
                <div className="input-group m-b-sm">
                    <label>Professeur</label>
                    <select
                        className="form-control"
                        name="teacher_id"
                        onChange={({target:{name, value}}) => onChange(name, value)}
                        value={selectedTeacherId}>
                        {_.map(teachers, optionMapper(USER_OPTIONS))}
                    </select>
                </div>
            ) : (
                "Aucun professeur principal pour ce cours"
            )}
        </div>
    );
};