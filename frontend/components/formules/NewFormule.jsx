import React, {useEffect, useState} from 'react';
import Modal from "react-modal";
import InputSelect from "../common/InputSelect";
import * as api from "../../tools/api";
import swal from "sweetalert2";

export default function NewFormule() {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [activities, setActivities] = useState([]);
    const [activityRefKind, setActivityRefKind] = useState([]);
    const [selectedActivities, setSelectedActivities] = useState([]);

    const [loading, setLoading] = useState(false);

    async function fetchActivities() {
        setLoading(true);
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
        } finally {
            setLoading(false);
        }
    }

    async function fetchActivityRefKind() {
        setLoading(true);
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
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchActivities();
        fetchActivityRefKind();
    }, []);

    function displayActivities() {
        return activityRefKind.map((kind) => {
            return {
                label: kind.name,
                options: [
                    {
                        label: `Famille: ${kind.name}`,
                        value: `famille-${kind.id}`
                    },
                    ...activities
                        .filter(activity => activity.activity_ref_kind_id === kind.id)
                        .map(activity => ({
                            label: activity.label,
                            value: activity.id
                        }))
                ]
            };
        });
    }


    return (
        <div className="row p-2">

            <form>
                <div className="row">
                    <div className="col-md-6 col-xs-12">
                        {/*--------------------------------NOM DE LA FORMULE------------------------------------------*/}
                        <div className="form-group mb-5">
                            <label htmlFor="nom">Nom de la formule</label>
                            <input type="text" className="form-control" id="nom" placeholder="Nom de la formule"/>
                        </div>
                        {/*--------------------------------DESCRIPTION------------------------------------------*/}
                        <div className="form-group mb-5">
                            <label htmlFor="activites">Description</label>
                            <textarea className="form-control" id="description"/>
                        </div>
                        {/*--------------------------------ACTIVITES------------------------------------------*/}
                        <div className="d-inline-flex justify-content-between w-100 mt-5">
                            <div>
                                <label htmlFor="activites">Activités</label>
                            </div>
                            <div>
                                <button type="button" className="btn btn-primary"
                                        onClick={() => setModalIsOpen(true)}>Ajouter une activité
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

            {/*    ----------------------MODAL ADD ACTIVITY------------------------------*/}
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
                            <label htmlFor="nom">Sélectionner une famille ou des activités</label>
                            <InputSelect
                                input={{
                                    name: "selectedActivities",
                                    onChange: e => this.handleChange({
                                        selectedActivities: e.target.value,
                                    }),
                                    value: selectedActivities,
                                }}
                                meta={{}}
                                options={displayActivities()}
                                inline={true}
                            />
                        </div>
                        <div className="form-group mb-5">
                            <label htmlFor="activites">Nombre d'activités à choisir parmi les activités
                                sélectionnées</label>
                            <input type="text" className="form-control" id="activitiesToSelect"/>
                        </div>
                    </div>
                </div>
                <div className="row text-right m-5 ">
                    <button type="submit" className="btn btn-primary">Valider</button>
                </div>
            </Modal>

        </div>
    );
}