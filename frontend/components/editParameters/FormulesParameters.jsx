import React, { Fragment, useState } from "react";
import PropTypes from "prop-types";
import * as api from "../../tools/api";
import swal from "sweetalert2";
export default function FormulesParameters({ show_formules }) {
    const [showFormules, setShowFormules] = useState(show_formules);
    const [isSaving, setIsSaving] = useState(false);
    function onSubmit() {
        setIsSaving(true);
        swal.showLoading();
        api.set()
            .success((data) => {
                if (data.success) {
                    setIsSaving(false);
                    swal({
                        title: "Succès",
                        text: "Les paramètres ont été sauvegardés",
                        type: "success"
                    });
                    window.location.reload();
                }
                else {
                    setIsSaving(false);
                    swal({
                        title: "Erreur",
                        text: "Une erreur est survenue lors de la sauvegarde des paramètres",
                        type: "error"
                    });
                }
            })
            .error(() => {
                setIsSaving(false);
                swal({
                    title: "Erreur",
                    text: "Une erreur est survenue lors de la sauvegarde des paramètres",
                    type: "error"
                });
            })
            .post("/parameters/formules", {
                show_formules: showFormules
            }, {});
    }
    return (
        <Fragment>
            <h3 className="mt-5">Affichage des formules</h3>
            <div className="mb-sm-3 mt-3">
                <input
                    type="checkbox"
                    id="showFormulesCheck"
                    checked={showFormules}
                    disabled={isSaving}
                    onChange={() => setShowFormules(!showFormules)}
                />
                &nbsp;
                <label className="ml-2 font-normal" htmlFor="showFormulesCheck">
                    Activer les formules
                </label>
            </div>
            <button className="btn btn-success no-margin pull-right" onClick={onSubmit} disabled={isSaving}>
                Sauvegarder
            </button>
        </Fragment>
    );
}
FormulesParameters.propTypes = {
    show_formules: PropTypes.bool
};
