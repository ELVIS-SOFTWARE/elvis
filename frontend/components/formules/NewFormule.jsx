import React, {useEffect, useState} from 'react';
import Modal from "react-modal";
import * as api from "../../tools/api";
import swal from "sweetalert2";
import {default as ReactSelect, components} from "react-select";

const Option = (props) => {
    const {data, isSelected} = props;

    return (
        <components.Option {...props}>
            {data.isFamily ? (
                <div style={{fontWeight: "bold"}}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => null}
                        style={{marginRight: "10px"}}
                    />
                    {data.label}
                </div>
            ) : (
                <div className="ml-3">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => null}
                        style={{marginRight: "10px"}}
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
    const [nbActivitiesToSelect, setNbActivitiesToSelect] = useState(0);
    const [validationError, setValidationError] = useState({
        selectedActivities: '',
        nbActivitiesToSelect: '',
    });


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
            setSelectedActivities([]);
            setValidationError(prevState => ({
                ...prevState,
                selectedActivities: 'Veuillez sélectionner au moins une activité.'
            }));
            return;
        }
        const selected = [];

        selectedOptions.forEach(option => {
            if (option.isFamily) {   // Ajouter toutes les activités de la famille sélectionnée
                const familyActivities = activities
                    .filter(activity => `family-${activity.activity_ref_kind_id}` === option.value)
                    .map(activity => ({
                        label: activity.label,
                        value: `activity-${activity.id}`,
                    }));
                selected.push(...familyActivities);
            } else {// Ajouter une activité spécifique
                selected.push(option);
            }
        });
        const uniqueSelectedActivities = Array.from(
            new Map(selected.map(item => [item.value, item])).values()
        );

        setSelectedActivities(uniqueSelectedActivities);
        setValidationError(prevState => ({
            ...prevState,
            selectedActivities: ''
        }));
    };

    const displayActivities = () => {
        const familyOptions = activityRefKind.map(kind => ({
            label: `${kind.name}`,
            value: `family-${kind.id}`,
            isFamily: true,
            activities: activities
                .filter(activity => activity.activity_ref_kind_id === kind.id)
                .map(activity => ({
                    label: activity.label,
                    value: `activity-${activity.id}`,
                    isFamily: false,
                })),
        }));

        return familyOptions.reduce((acc, family) => {
            acc.push({
                ...family,
                activities: family.activities, // Inclure les activités sous la famille
            });
            family.activities.forEach(activity => acc.push(activity));
            return acc;
        }, []);
    };

    const handleNbActivitiesToSelectChange = (e) => {
        const value = e.target.value;
        if (value === '') {
            setValidationError(prevState => ({
                ...prevState,
                nbActivitiesToSelect: 'Le champ ne peut pas être vide.'
            }));
        } else if (!isNaN(value)) {
            setNbActivitiesToSelect(Number(value));
            setValidationError(prevState => ({
                ...prevState,
                nbActivitiesToSelect: ''
            }));
        } else {
            setValidationError(prevState => ({
                ...prevState,
                nbActivitiesToSelect: 'Veuillez entrer un nombre valide.'
            }));
        }
    };

    const handleValidate = () => {
        let errors = {
            selectedActivities: '',
            nbActivitiesToSelect: ''
        };
        if (selectedActivities.length === 0) {
            errors.selectedActivities = 'Veuillez sélectionner au moins une activité.';
        }
        if (nbActivitiesToSelect === 0) {
            errors.nbActivitiesToSelect = 'Veuillez entrer un nombre valide.';
        }
        setValidationError(errors);
    };


    return (
        <div className="row p-2">
            <form>
                <div className="row">
                    <div className="col-md-6 col-xs-12">
                        <div className="form-group mb-5">
                            <label htmlFor="nom">Nom de la formule</label>
                            <input type="text" className="form-control" id="nom" placeholder="Nom de la formule"/>
                        </div>
                        <div className="form-group mb-5">
                            <label htmlFor="description">Description</label>
                            <textarea className="form-control" id="description"/>
                        </div>
                        <div className="d-inline-flex justify-content-between w-100 mt-5">
                            <div>
                                <label htmlFor="activites">Activités</label>
                            </div>
                            <div>
                                <button type="button" className="btn btn-primary"
                                        onClick={() => setModalIsOpen(true)}>
                                    Ajouter une activité
                                </button>
                            </div>
                            {selectedActivities.map(activity => (

                                <div key={activity.value}
                                     className="d-inline-flex justify-content-between w-100 mt-5">
                                    <div>
                                        <label htmlFor="activites">{activity.label}</label>
                                    </div>
                                </div>
                            ))}

                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-8 col-xs-12 text-right">
                        <button type="submit" className="btn btn-primary">Enregistrer</button>
                    </div>
                </div>
            </form>

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
                            {validationError.selectedActivities &&
                                <div className="text-danger">{validationError.selectedActivities}</div>}
                        </div>
                        <div className="form-group mb-5">
                            <label htmlFor="activitiesToSelect">Nombre d'activités à choisir parmi les activités
                                sélectionnées</label>
                            <input
                                type="text"
                                className="form-control"
                                id="activitiesToSelect"
                                onChange={handleNbActivitiesToSelectChange}
                            />
                            {validationError.nbActivitiesToSelect &&
                                <div className="text-danger">{validationError.nbActivitiesToSelect}</div>}
                        </div>
                    </div>
                </div>
                <div className="row text-right m-5">
                    <button className="btn btn-primary" onClick={handleValidate}>Valider</button>
                </div>
            </Modal>
        </div>
    );
}
