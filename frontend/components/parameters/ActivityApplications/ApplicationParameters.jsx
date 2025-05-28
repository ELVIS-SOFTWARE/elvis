import React, { Fragment, useEffect } from "react";
import { useState } from "react";
import * as api from "../../../tools/api";
import swal from "sweetalert2";

export default function ApplicationParameters() {
    const [isLoading, setIsLoading] = useState(true);
    const [parameters, setParameters] = useState([]);
    const [selectedParameter, setSelectedParameter] = useState(0);
    const [autoAssignEnabled, setAutoAssignEnabled] = useState(false);

    useEffect(() => {
        api.set()
            .success((data) => {
                setSelectedParameter((data.defaultActivityApplicationStatus || {}).id || 0);
                setParameters(data.activityApplicationStatusList);
                setAutoAssignEnabled(data.autoAssignEnabled || false);
                setIsLoading(false);
            })
            .error(() => {
                swal({
                    title: "Erreur lors du chargement des paramètres",
                    type: "error",
                });
            })
            .get("/get_activity_application_parameters", {});
    }, []);

    const onSubmit = () => {
        api.set()
            .useLoading()
            .success(() => {
                swal({ title: "Sauvegarde effectuée", type: "success" });
            })
            .error(() => {
                swal({ title: "Erreur lors de la sauvegarde", type: "error" });
            })
            .post(
                "/set_activity_application_parameters",
                {
                    default_status_id: selectedParameter,
                    auto_assign_enabled: autoAssignEnabled,
                },
                {}
            );
    };

    const handleParameterChange = (event) => {
        setSelectedParameter(event.target.value);
    };

    const handleAutoAssignToggle = (event) => {
        setAutoAssignEnabled(event.target.checked);
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <Fragment>
            <div className="row">
                <div className="col-md-5">
                    <h3>Statut d'inscription par défaut</h3>
                    <div className="form-group mb-3">
                        <select
                            className="form-control"
                            value={selectedParameter}
                            onChange={handleParameterChange}
                        >
                            {parameters.map((parameter) => (
                                <option key={parameter.id} value={parameter.id}>
                                    {parameter.label}
                                </option>
                            ))}
                        </select>
                        <p className="mt-3">
                            Le statut sélectionné sera le statut par défaut pour les nouvelles
                            inscriptions.
                        </p>
                    </div>
                </div>
            </div>

            {/* Section auto attribution placée au-dessus du bouton */}
            <div className="row mt-3">
                <div className="col-md-5">
                    <h3>Attribution automatique du statut cours attribué</h3>
                    <div className="form-group form-check mb-3">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id="autoAssignCheck"
                            checked={autoAssignEnabled}
                            onChange={handleAutoAssignToggle}
                            style={{ marginRight: "1rem" }}
                        />
                        <label className="form-check-label" htmlFor="autoAssignCheck">
                             Activer
                        </label>
                    </div>
                </div>
            </div>

            <div className="row mt-3">
                <div className="col-md-5">
                    <button
                        className="btn btn-success pull-right mt-5"
                        onClick={onSubmit}
                    >
                        Valider
                    </button>
                </div>
            </div>
        </Fragment>
    );
}
