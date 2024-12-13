import React, { useEffect } from "react";
import * as api from "../../../tools/api";
import swal from "sweetalert2";

export default function PlanningDisplayParameters()
{
    const [showActivityCode, setShowActivityCode] = React.useState(false);
    const [recurrenceActivated, setRecurrenceActivated] = React.useState(false);

    useEffect(() =>
    {
        api.set()
            .success((data) =>
            {
                setShowActivityCode(data.show_activity_code);
                setRecurrenceActivated(data.recurrence_activated);
            })
            .error(() =>
            {
                swal({
                    title: "Erreur lors du chargement des paramètres",
                    type: "error",
                });
            })
            .get("/parameters/planning/school_planning_params", {});
    }, []);

    const onSubmit = (e) =>
    {
        api.set()
            .success(() =>
            {
                swal({
                    title: "Paramètres modifiés",
                    type: "success",
                });
            })
            .error(() =>
            {
                swal({
                    title: "Erreur lors de la modification des paramètres",
                    type: "error",
                });
            })
            .post("/parameters/planning/school_planning_params", {
                show_activity_code: showActivityCode,
                recurrence_activated: recurrenceActivated
            });
    };

    return <div className="row">
        <div className="col-md-5">
            <h3>Paramètres d'affichage des plannings</h3>

            <div className="form-group mb-3">

                <input id="show_activity_code" type="checkbox" checked={showActivityCode}
                       onChange={() => setShowActivityCode(!showActivityCode)} />
                <label htmlFor="show_activity_code" className="ml-2 font-normal">Afficher le code de l'activité</label>
            </div>

            <div className="form-group mb-3">

                <input id="recurrence_activated" type="checkbox" checked={recurrenceActivated}
                       onChange={() => setRecurrenceActivated(!recurrenceActivated)} />
                <label htmlFor="recurrence_activated" className="ml-2 font-normal">Permettre la récurrence des disponibilités</label>
            </div>

            <button className="btn btn-success pull-right mt-5" onClick={onSubmit}>Valider</button>
        </div>
    </div>;
}