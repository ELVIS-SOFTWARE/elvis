import React, {Component, Fragment, useEffect} from "react";
import * as api from "../../../tools/api";
import swal from "sweetalert2";

export default function CancelActivityParameters()
{
    const [hours, setHours] = React.useState(0);

    useEffect(() => {
        api.set()
            .success((data) => {
                setHours(data.hours);
            })
            .error(() => {
                swal({
                    title: "Erreur lors du chargement des paramètres",
                    type: "error",
                });
            })
            .get("/parameters/hours_before_cancelling_activity", {});
    }, []);

    const onSubmit = () => {
        api.set()
            .success(() => {
                swal({
                    title: "Sauvegarde effectuée",
                    type: "success",
                });
            })
            .error(() => {
                swal({
                    title: "Erreur lors de la sauvegarde",
                    type: "error",
                });
            })
            .post("/parameters/hours_before_cancelling_activity", {
                hours: hours,
            }, {});
    }

    const hoursEdit = (event) => {
        setHours(event.target.value);
    };

    return <Fragment>
        <div className="row">
            <div className="col-md-5">
                <h3>Nombre d'heures</h3>
                <div className="form-group mb-3">
                    <input type="text" className="form-control" id="hours" value={hours} onChange={hoursEdit}/>
                    <p className="mt-3">En dessous de ce nombre d'heures il sera impossible pour l'élève d'annuler son cours.</p>
                </div>

                <button className="btn btn-success pull-right mt-5" onClick={onSubmit}>Valider</button>
            </div>
        </div>
    </Fragment>
}