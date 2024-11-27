import React, {useEffect, useState} from 'react';
import Modal from "react-modal";
import * as api from "../../tools/api";
import swal from "sweetalert2";
import {default as ReactSelect, components} from "react-select";

const Option = (props) => {
    const handleClick = () => {
        props.selectOption(props.data);
    };

    return (
        <components.Option {...props}>
            <input
                type="checkbox"
                checked={props.isSelected}
                onChange={() => null}
            />
            <label>{props.label}</label>
        </components.Option>
    );
};

export default function NewFormule() {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [activities, setActivities] = useState([]);
    const [activityRefKind, setActivityRefKind] = useState([]);
    const [selectedActivities, setSelectedActivities] = useState([]);
    const [loading, setLoading] = useState(false);

    // Récupérer les données des activités
    async function fetchActivities() {
        try {
            await api.set()
                .success(res => {
                    setActivities(res);
                })
                .error(res => {
                    swal("Une erreur est survenue lors de la récupération des données", res.error, "error");
                })
                .get('/activity_ref');
        } catch (e) {
            swal("Une erreur est survenue lors de la récupération des données", e.message, "error");
        }
    }

    // Récupérer les familles d'activités
    async function fetchActivityRefKind() {
        try {
            await api.set()
                .success(res => {
                    setActivityRefKind(res);
                })
                .error(res => {
                    swal("Une erreur est survenue lors de la récupération des données", res.error, "error");
                })
                .get('/activity_ref_kind');
        } catch (e) {
            swal("Une erreur est survenue lors de la récupération des données", e.message, "error");
        }
    }

    useEffect(() => {
        fetchActivities();
        fetchActivityRefKind();
    }, []);


    // Mise à jour des activités sélectionnées
    const handleActivityChange = (selectedOptions) => {
        setSelectedActivities(selectedOptions || []);
    };


    // Affichage des activités regroupées par famille
    const displayActivities = () => {
        return activityRefKind.map(kind => ({
            label: kind.name,
            id: kind.id,
            options: activities
                .filter(activity => activity.activity_ref_kind_id === kind.id)
                .map(activity => ({
                    label: activity.label,
                    value: activity.id,
                })),
        }));
    };

    return (
        <div className="row p-2">
            <form>
                <div className="row">
                    <div className="col-md-6 col-xs-12">
                        {/* Nom de la formule */}
                        <div className="form-group mb-5">
                            <label htmlFor="nom">Nom de la formule</label>
                            <input type="text" className="form-control" id="nom" placeholder="Nom de la formule"/>
                        </div>
                        {/* Description */}
                        <div className="form-group mb-5">
                            <label htmlFor="description">Description</label>
                            <textarea className="form-control" id="description"/>
                        </div>
                        {/* Activités */}
                        <div className="d-inline-flex justify-content-between w-100 mt-5">
                            <div>
                                <label htmlFor="activites">Activités</label>
                            </div>
                            <div>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => setModalIsOpen(true)}
                                >
                                    Ajouter une activité
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-8 col-xs-12 text-right">
                        <button type="submit" className="btn btn-primary">Enregistrer</button>
                    </div>
                </div>
            </form>

            {/* Modal Ajouter Activité */}
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={() => setModalIsOpen(false)}
                contentLabel="addActivityModal"
                className="Modal p-3"
            >
                <button type="button" className="close" onClick={() => setModalIsOpen(false)}>
                    &times;
                </button>

                <div className="row m-5">
                    <h2 className="m-0">Ajouter des activités à une formule</h2>

                    <div className="mt-5">
                        <div className="form-group mb-5">
                            <label htmlFor="activites">Sélectionner une famille ou des activités</label>
                            <ReactSelect
                                options={displayActivities()}
                                isMulti={true}
                                isClearable={true}
                                components={{Option}}
                                value={selectedActivities}
                                onChange={handleActivityChange}
                                closeMenuOnSelect={false}
                            />
                        </div>
                        <div className="form-group mb-5">
                            <label htmlFor="activitiesToSelect">Nombre d'activités à choisir parmi les activités
                                sélectionnées</label>
                            <input type="text" className="form-control" id="activitiesToSelect"/>
                        </div>
                    </div>
                </div>
                <div className="row text-right m-5">
                    <button type="submit" className="btn btn-primary">Valider</button>
                </div>
            </Modal>
        </div>
    );
}
