import React, { Fragment, useState } from "react";
import PropTypes from "prop-types";
import * as api from "../../tools/api";
import swal from "sweetalert2";

/**
 * Component for teachers parameters
 * @param {boolean} teacher_can_edit_planning
 * @param {boolean} authorize_teachers
 * @param {boolean} show_teacher_contacts
 * @returns {JSX.Element}
 * @constructor
 */
export default function TeachersParameters({ teacher_can_edit_planning, authorize_teachers, show_teacher_contacts }) {
    const [planningChecked, setPlanningChecked] = useState(teacher_can_edit_planning);
    const [permitTeacherActivities, setPermitTeacherActivities] = useState(authorize_teachers);
    const [showTeacherContacts, setShowTeacherContacts] = useState(show_teacher_contacts);

    function onSubmit() {
        swal.showLoading();

        api.set()
            .success((data) => {
                if (data.success) {
                    swal({
                        title: "Succès",
                        text: "Les paramètres ont été sauvegardés",
                        type: "success"
                    });

                    window.location.reload();
                }
                else {
                    swal({
                        title: "Erreur",
                        text: "Une erreur est survenue lors de la sauvegarde des paramètres",
                        type: "error"
                    });
                }
            })
            .error(() => {
                swal({
                    title: "Erreur",
                    text: "Une erreur est survenue lors de la sauvegarde des paramètres",
                    type: "error"
                });
            })
            .post("/parameters/teachers", {
                teacher_can_edit_planning: planningChecked,
                authorize_teachers: permitTeacherActivities,
                show_teacher_contacts: showTeacherContacts
            }, {});
    }

    return (
        <Fragment>
            <h3 className="mt-5">Droit sur le planning</h3>
            <div className="mb-sm-3 mt-3">
                <input
                    type="checkbox"
                    id="planningCheck"
                    checked={planningChecked}
                    onChange={() => setPlanningChecked(!planningChecked)}
                />
                &nbsp;
                <label className="ml-2 font-normal" htmlFor="planningCheck">
                    Le professeur peut modifier son planning
                </label>
            </div>

            <h3>Droit sur les demandes d'inscriptions</h3>
            <div className="row">
                <div className="col-md-5">
                    <input
                        type="checkbox"
                        id="check"
                        checked={permitTeacherActivities}
                        onChange={() => setPermitTeacherActivities(!permitTeacherActivities)}
                    />
                    &nbsp;
                    <label className="ml-2 font-normal" htmlFor="check">
                        Permettre aux professeurs de gérer les demandes d'inscriptions qui leur sont liées
                    </label>
                </div>
            </div>

            <h3>Coordonnées</h3>
            <div className="mb-sm-3 mt-3">
                <input
                    type="checkbox"
                    id="showTeacherContactsCheck"
                    checked={showTeacherContacts}
                    onChange={() => setShowTeacherContacts(!showTeacherContacts)}
                />
                &nbsp;
                <label className="ml-2 font-normal" htmlFor="showTeacherContactsCheck">
                    Afficher les coordonnées du professeur sur la page de l'élève
                </label>
            </div>

            <button className="btn btn-success no-margin pull-right" onClick={onSubmit}>
                Sauvegarder
            </button>
        </Fragment>
    );
}

TeachersParameters.propTypes = {
    teacher_can_edit_planning: PropTypes.bool,
    authorize_teachers: PropTypes.bool,
    show_teacher_contacts: PropTypes.bool
};
