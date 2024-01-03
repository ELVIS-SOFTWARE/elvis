import React, {Fragment, useState} from "react";
import Modal from "react-modal";
import {Form, Field} from 'react-final-form';
import * as api from "../../../tools/api";
import swal from "sweetalert2";

export default function AdhesionEditModal({children, adhesion, seasons, onAdd, onEdit}) {
    const [showModal, setShowModal] = useState(false);

    function onSubmit(formData) {
        const action = api.set()
            .success(data => {
                if ((adhesion || {}).id) {
                    onEdit(data);
                } else {
                    onAdd(data);
                    setShowModal(false);
                }
            })
            .error(data => {
                console.error(data);

                const message = Array.isArray(data) ? data.join(" - ") : 'Une erreur est survenue. Contactez un administrateur';

                swal({
                    title: 'Erreur',
                    text: message,
                    type: 'error'
                });
            });

        if ((adhesion || {}).id)
            action.put(`/adhesion-prices/${adhesion.id}`, formData);
        else
            action.post('/adhesion-prices', formData);
    }

    return <Fragment>
        <button className="btn btn-primary m-r-sm" onClick={e => setShowModal(true)}>
            {children}
        </button>

        <Modal
            isOpen={showModal}
            className="modal-dialog modal-md"
            appElement={document.getElementById('wrapper')}
            onRequestClose={() => setShowModal(false)}
        >


            <div className="row">
                <div className="col-sm-12">
                    <h2>
                        {(adhesion || {}).label ? `Modifier l'adhésion` : "Nouvelle adhésion"}
                    </h2>
                </div>
            </div>


            <Form

                initialValues={{
                    label: (adhesion || {}).label || "Prix par défaut",
                    price: (adhesion || {}).price,
                    season_id: (adhesion || {}).season_id
                }}
                onSubmit={onSubmit}
                render={({handleSubmit, form, submitting, pristine, values}) => (

                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-sm-6">
                                <label>Nom <span className={"text-danger"}>*</span></label>
                                <Field name="label"
                                       component="input"
                                       type="text"
                                       className="form-control"
                                       disabled={(adhesion || {}).built_in}/>

                            </div>
                        </div>

                        <div className="row mt-5">
                            <div className="col-sm-6">
                                <label>Prix <span className={"text-danger"}>*</span></label>
                                <Field
                                    name="price"
                                    component="input"
                                    type="number"
                                    step="0.1"
                                    className="form-control"/>
                            </div>
                        </div>

                        <div className="row mt-5">
                            <div className="col-sm-6">
                                <label>Par défaut pour la saison :</label>
                                <Field
                                    name="season_id"
                                    component="select"
                                    className="form-control"
                                    disabled={(adhesion || {}).built_in}>
                                    <option></option>
                                    {(seasons || []).map(season => <option key={season.id}
                                                                           value={season.id}>{season.label}</option>)}
                                </Field>
                            </div>
                        </div>

                        <div className="row mt-5">
                            <div className="col-sm-6">
                                <button type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowModal(false)}>

                                    Annuler
                                </button>
                            </div>

                            <div className="col-sm-6 text-right">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submitting || pristine}>

                                    Enregistrer
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            />
        </Modal>
    </Fragment>
}
