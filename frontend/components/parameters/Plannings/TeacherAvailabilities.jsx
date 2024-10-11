import React, {Component, Fragment} from "react";
import * as api from "../../../tools/api";
import swal from "sweetalert2";
import PropTypes from "prop-types";

export default function TeacherAvailabilities({defaultChecked})
{
    const [checked, setChecked] = React.useState(defaultChecked || false);

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
            .post("/parameters/planning_parameters", {
                show_availabilities: checked ? "1" : "0"
            }, {});
    }

    return <Fragment>
        <h3>Disponibilité</h3>
        <div className="mb-sm-3 mt-3">
            <input type="checkbox" id="check" checked={checked} onChange={() => setChecked(!checked)} />
            &nbsp;
            <label className="ml-2 font-normal" htmlFor="check">Créer un créneau de disponibilité avant la création d'un cours</label>
        </div>
    </Fragment>
}

TeacherAvailabilities.propTypes = {
    defaultChecked: PropTypes.bool,
    planningDefaultChecked: PropTypes.bool
}