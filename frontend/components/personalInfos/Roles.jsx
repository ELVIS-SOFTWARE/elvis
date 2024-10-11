import React, { useState, Fragment } from "react";
import Checkbox from "../common/Checkbox";
import PropTypes from "prop-types";
import * as api from "../../tools/api";
import swal from "sweetalert2";
import { csrfToken } from "../utils";
import moment from "moment";
import "moment/locale/fr";

moment.locale("fr");

/**
 * @param {{is_teacher: boolean, is_admin: boolean, adhesions: []}} user
 * @param {({}) => void} onSubmit
 * @returns {JSX.Element}
 * @constructor
 */
export default function Roles({ user, lessonsPlanned, onSubmit }) {
    const [isTeacher, setIsTeacher] = useState(user.is_teacher);
    const [isAdmin, setIsAdmin] = useState(user.is_admin);

    function removeLessons() {
        api.set()
            .success(() => {
                swal.fire({
                    title: "Succès",
                    type: "success",
                    text: "Les séances à venir ont été supprimées",
                    width: "400px",
                    confirmButtonText: "Ok",
                }).then(() => {
                    setIsTeacher(false);
                });
            })
            .error(errorMsg => {
                console.error("error deleting activity instances : ", errorMsg);
                swal({
                    type: "error",
                    title: "Une erreur est survenue",
                });
            })
            .del(`/teachers/${user.id}/activity_instances`);
    }

    function formatActivity(a) {
        const day = moment(a.time_interval.start).format('dddd')
        const startsAt = moment(a.time_interval.start).format('HH:mm')
        const endsAt = moment(a.time_interval.end).format('HH:mm')
        return `Cours de ${a.activity_ref.label} le ${day} de ${startsAt} à ${endsAt}<br/>`;
    }

    function getActivitiesList() {
        return api.set()
            .success((activities) => {
                let res = "";
                const htmlText =
                    `Les ${lessonsPlanned} séances font partie des cours suivants :<br/><br/>` +
                    _.reduce(activities, (res, activity) => res + formatActivity(activity), res);

                swal.fire({
                    title: "Liste des cours à remplacer",
                    type: "success",
                    html: htmlText,
                    confirmButtonText: "Ok",
                    width: 600,
                });
            })
            .error(errorMsg => {
                console.error("error fetching lessons : ", errorMsg);
                swal({
                    type: "error",
                    title: "Une erreur est survenue",
                });
            })
            .get(`/teachers/${user.id}/activities/`);
    }

    function onChangeIsTeacher(isTeacher) {
        // dans le cas où on cherche à désactiver le rôle professeur, on doit prendre quelques précautions
        if (isTeacher && lessonsPlanned > 0) {
            swal.fire({
                title: "Etes-vous sûr ?",
                html: `Ce professeur a ${lessonsPlanned} séances de cours à venir dans le planning.<br/>Que souhaitez-vous faire ?`,
                confirmButtonText: "Les supprimer",
                cancelButtonText: "Annuler et voir les séances",
                showCancelButton: true,
            })
                .then(res => {
                    if (res.value) {
                        removeLessons();
                    } else {
                        getActivitiesList();
                    }
                })


            return;
        }

        setIsTeacher(!isTeacher);
    }

    return <div className="padding-page application-form">
        <div className="ibox m-b-lg">
            <Checkbox
                id="is_teacher"
                label="Professeur"
                input={{
                    checked: isTeacher,
                    onChange: () => onChangeIsTeacher(isTeacher)
                }}
            />

            <Checkbox
                id="is_admin"
                label="Administrateur"
                input={{
                    checked: isAdmin,
                    onChange: () => setIsAdmin(!isAdmin)
                }}
            />

            <div className="w-100 text-right">
                <button className="btn btn-success"
                    onClick={() => onSubmit({ ...user, is_teacher: isTeacher, is_admin: isAdmin })}>Enregistrer
                </button>
            </div>
        </div>
    </div>
}

Roles.propTypes = {
    user: PropTypes.shape({
        is_admin: PropTypes.bool.isRequired,
        is_teacher: PropTypes.bool.isRequired,
        adhesions: PropTypes.arrayOf(PropTypes.shape({
            is_active: PropTypes.bool.isRequired,
            season_id: PropTypes.number.isRequired,
            validity_start_date: PropTypes.string,
            validity_end_date: PropTypes.string
        }))
    })
}