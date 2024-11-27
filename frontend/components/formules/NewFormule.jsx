import React, { useEffect, useState } from 'react';
import Modal from "react-modal";
import * as api from "../../tools/api";
import swal from "sweetalert2";
import { default as ReactSelect, components } from "react-select";

const Option = (props) => {
    const { data, isSelected } = props;

    return (
        <components.Option {...props}>
            {data.isFamily ? (
                <div style={{ fontWeight: "bold", color: "rgb(0, 111.3073298429, 175.7)" }}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => null} // Ne pas modifier ici, gestion via handleActivityChange
                        style={{ marginRight: "10px" }}
                    />
                    {data.label}
                </div>
            ) : (
                <div className="ml-3">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => null} // Ne pas modifier ici, gestion via handleActivityChange
                        style={{ marginRight: "10px" }}
                    />
                    {data.label}
                </div>
            )}
        </components.Option>
    );
};

export default function NewFormule() {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [activities, setActivities] = useState([]);
    const [activityRefKind, setActivityRefKind] = useState([]);
    const [selectedActivities, setSelectedActivities] = useState([]);
    const [loading, setLoading] = useState(false);

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

    const handleActivityChange = (selectedOptions) => {
        if (!selectedOptions) {
            setSelectedActivities([]); // Réinitialiser si aucune option n'est sélectionnée
            return;
        }

        const selected = [];

        selectedOptions.forEach(option => {
            if (option.isFamily) {
                // Ajouter toutes les activités de la famille sélectionnée
                const familyActivities = activities
                    .filter(activity => `family-${activity.activity_ref_kind_id}` === option.value)
                    .map(activity => ({
                        label: activity.label,
                        value: `activity-${activity.id}`,
                    }));
                selected.push(...familyActivities);
            } else {
                // Ajouter une activité spécifique
                selected.push(option);
            }
        });

        // Supprimer les doublons (en utilisant Map pour éviter les duplications)
        const uniqueSelectedActivities = Array.from(
            new Map(selected.map(item => [item.value, item])).values()
        );

        setSelectedActivities(uniqueSelectedActivities);
    };

    const displayActivities = () => {
        // Construire les options pour les familles et leurs activités
        const familyOptions = activityRefKind.map(kind => ({
            label: `${kind.name}`,
            value: `family-${kind.id}`, // Identifiant unique pour chaque famille
            isFamily: true, // Marquer comme famille
            activities: activities
                .filter(activity => activity.activity_ref_kind_id === kind.id)
                .map(activity => ({
                    label: activity.label,
                    value: `activity-${activity.id}`,
                    isFamily: false, // Marquer comme activité
                })),
        }));

        // Affichage des familles d'abord, puis des activités individuelles
        return familyOptions.reduce((acc, family) => {
            acc.push({
                ...family,
                activities: family.activities, // Inclure les activités sous la famille
            });

            // Ajouter les activités indépendantes sous les familles correspondantes
            family.activities.forEach(activity => acc.push(activity));

            return acc;
        }, []);
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
                                components={{ Option }}
                                value={selectedActivities}
                                onChange={handleActivityChange}
                                closeMenuOnSelect={false}
                            />
                        </div>
                        <div className="form-group mb-5">
                            <label htmlFor="activitiesToSelect">Nombre d'activités à choisir parmi les activités sélectionnées</label>
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
