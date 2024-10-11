import React, {Fragment, useState} from "react";
import Modal from "react-modal";
import {Field, Form} from "react-final-form";
import Input from "../../common/Input";
import InputSelect from "../../common/InputSelect";
import Checkbox from "../../common/Checkbox";
import DragAndDrop from "../../editParameters/DragAndDrop";

export default function ConsentDocumentModal({document, isOpen, isFetching, onRequestClose, onSubmit}) {
    const required = value => (value ? undefined : 'requis')
    const [file, setFile] = useState(undefined);
    const [fileHasChanged, setFileHasChanged] = useState(false);

    function handleSubmit(values) {
        onSubmit(values, file, fileHasChanged);
    }


    if(document===null && fileHasChanged)
        setFileHasChanged(false);

    return isOpen ?
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
        >
            <div className="modal-header">
                <h3 className="modal-title">Edition d'un document de consentement</h3>
                <button type="button"
                        className="close"
                        aria-label="Close"
                        onClick={onRequestClose}>
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>

            <div className="modal-body">

                <Form
                    onSubmit={handleSubmit}
                    initialValues={document}
                    render={({handleSubmit, values}) =>

                        <form onSubmit={handleSubmit}>
                            <Field
                                id="title"
                                label="Titre du document"
                                htmlOptions={{
                                    placeholder: "Titre",
                                }}
                                name="title"
                                type="text"
                                required
                                validate={required}
                                render={Input}
                            />

                            <Field
                                id="content"
                                label="Renseignez votre texte"
                                htmlOptions={{
                                    placeholder: "Texte à faire valider par vos élèves",
                                }}
                                name="content"
                                isArea={true}
                                validate={required}
                                required
                                render={Input}
                            />
                            <span style={{top: "-15px", position: "relative"}} className="small" >
                                Le texte {"{schoolName}"} sera remplacé par le nom de votre établissement.
                            </span>

                            <Field
                                id="attached_file"
                                name="attached_file"
                                render={(props) => <DragAndDrop
                                    file_url={values.attached_file_url}
                                    fileLabel="Fichier joint : "
                                    fileTitle={values.title}
                                    setFile={f => {
                                        setFile(f);
                                        setFileHasChanged(true);
                                    }}
                                    acceptedTypes={"application/pdf"}
                                    textDisplayed={"Pour ajouter un PDF, déposez un fichier ici"}
                                />}
                            />


                            <Field
                                id="expected_answer"
                                label="Pour passer à l'étape suivante, l'élève doit donner son consentement"
                                name="expected_answer"
                                checked="expected_answer"
                                type="checkbox"
                                render={Checkbox}
                                extraTitle="Le consentement est-il nécessaire ?"
                            />

                            <div style={{padding: 20, display: "flex", justifyContent: "flex-end", gap: "20px"}}>

                                <button type="reset"
                                        className="btn btn-secondary"
                                        onClick={onRequestClose}>
                                    Annuler
                                </button>

                                <button
                                    type="submit"
                                    className="btn btn-primary">
                                    Enregistrer
                                    {isFetching &&
                                        <span>&nbsp;<i className="fas fa-circle-notch fa-spin"></i></span>
                                    }
                                </button>
                            </div>

                        </form>
                    }>

                </Form>

            </div>

        </Modal>
        :
        null;

}