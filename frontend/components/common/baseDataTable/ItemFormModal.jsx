import React, {useState} from "react";
import Modal from "react-modal";
import {Form} from "react-final-form";

export default function ItemFormModal(props) {

    const FormContentComponent = props.component;
    const isUpdate = !!(props.item && props.item.id);

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState(null);

    const handleSubmit = (values) => {
        setSubmitting(true);
        props.onSubmit(values)
            .then(() => {
                setSubmitting(false);
                props.onRequestClose();
            })
            .catch((err) => {
                setSubmitting(false);
                setErrors(err);
            });
    }

    const handleAfterClose = () => {
        setErrors(null);
    }

    return (
        <Modal
            isOpen={props.isOpen}
            onAfterClose={handleAfterClose}
            onRequestClose={props.onRequestClose}
            className="modal-dialog modal-sm"
        >
            <div className="modal-header">
                <h4 className="modal-title">{isUpdate ? props.updateTitle || "Mise à jour" : props.createTitle || "Création"}</h4>
                <button type="button" className="close" onClick={props.onRequestClose}>
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>

            <div className="modal-body">
                <div className="col-lg-12">
                    <Form
                        onSubmit={handleSubmit}
                        initialValues={props.item}

                        render={({handleSubmit}) => (
                            <form onSubmit={handleSubmit}>

                                <FormContentComponent
                                    item={props.item}
                                    isUpdate={isUpdate}
                                />

                                <div style={{padding: 20, display: "flex", justifyContent: "flex-end", gap: "20px"}}>
                                    <div>
                                        <button
                                            type="reset" className="btn btn-block"
                                            onClick={props.onRequestClose}
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                    <div>
                                        <button type="submit" className="btn btn-primary btn-block">
                                            Sauvegarder
                                            &nbsp;
                                            {submitting ?
                                                <i className="fas fa-circle-notch fa-spin"></i>
                                                :
                                                ""}
                                        </button>
                                    </div>
                                </div>

                                <div>{
                                    errors && <div className="alert alert-danger">Erreur(s) :
                                        <ul>
                                            {Array.isArray(errors)  ?
                                                _.map(errors, (error, index) => {
                                                return <li key={index}>{error}</li>})
                                                :
                                                <li>{errors.toString()}</li>
                                            }
                                        </ul>
                                    </div>
                                }

                                </div>
                            </form>
                        )}
                    />
                </div>
            </div>
        </Modal>
    )
}
