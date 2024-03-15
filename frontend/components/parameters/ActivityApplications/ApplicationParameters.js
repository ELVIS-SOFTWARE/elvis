import React, { Fragment, useEffect } from "react";
import { useState } from "react";
import * as api from "../../../tools/api";
import swal from "sweetalert2";

export default function ApplicationParameters() {

    const [isLoading, setIsLoading] = useState(true);
    const [parameters, setParameters] = useState([]);
    const [selectedParameter, setSelectedParameter] = useState(null);

    useEffect(() => {
        api.set()
            .success((data) => {
                setSelectedParameter(data.default);
                setParameters(data.list);
                setIsLoading(false);
            })
            .error(() => {
                swal({
                    title: "Erreur lors du chargement des paramètres",
                    type: "error",
                });
            })
            .get("/get_default_and_list_activity_application_statuses", {});
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
            .post("/set_default_activity_application_status", {
                status_id: selectedParameter,
            }, {});
    }

    const handleParameterChange = (event) => {
        setSelectedParameter(event.target.value);
    };

    if (isLoading) {
        return <div>Loading...</div>;
    } else {
        return <Fragment>
            <div className="row">
                <div className="col-md-5">
                    <h3>Statut d'inscription par défaut</h3>
                    <div className="form-group mb-3">
                        <select className="form-control" defaultValue={selectedParameter.id} onChange={handleParameterChange}>
                            {parameters.map(parameter => (
                                <option key={parameter.id} value={parameter.id}>{parameter.label}</option>
                            ))}
                        </select>
                        <p className="mt-3">Le statut sélectionné sera le statut par défaut pour les nouvelles inscriptions.</p>
                    </div>

                    <button className="btn btn-success pull-right mt-5" onClick={onSubmit}>Valider</button>
                </div>
            </div>
        </Fragment>
    }
}