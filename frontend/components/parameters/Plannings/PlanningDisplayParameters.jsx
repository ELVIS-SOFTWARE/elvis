import React, { useEffect } from "react";
import * as api from "../../../tools/api";
import swal from "sweetalert2";

export default function PlanningDisplayParameters()
{
    const [showActivityCode, setShowActivityCode] = React.useState(false);

    useEffect(() =>
    {
        api.set()
            .success((data) =>
            {
                setShowActivityCode(data.show_activity_code);
            })
            .error(() =>
            {
                swal({
                    title: "Erreur lors du chargement des paramètres",
                    type: "error",
                });
            })
            .get("/parameters/show_activity_code", {});
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
            .post("/parameters/show_activity_code", { show_activity_code: showActivityCode });
    };

    return <div className="row">
        <div className="col-md-5">
            <h3>Paramètres d'affichage des plannings</h3>

            <div className="form-group mb-3">

                <input id="show_activity_code" type="checkbox" checked={showActivityCode} onChange={() => setShowActivityCode(!showActivityCode)} />
                <label htmlFor="show_activity_code" className="ml-2 font-normal">Afficher le code de l'activité</label>
            </div>

            <button className="btn btn-success pull-right mt-5" onClick={onSubmit}>Valider</button>
        </div>
    </div>;
}