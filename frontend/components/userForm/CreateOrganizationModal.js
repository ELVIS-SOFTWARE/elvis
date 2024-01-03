import React, {Fragment, useState} from "react";
import * as api from "../../tools/api";
import {redirectTo} from "../../tools/url";
import swal from "sweetalert2";
import Modal from "react-modal";
import {Field, Form} from "react-final-form";
import Input from "../common/Input";
import AlertCheckbox from "../common/AlertCheckbox";

const CreateOrganizationModal = ({urlRedirect}) => {
    const [isOpen, setIsOpen] = useState(false);

    const onSubmit = (e) => {
        api
            .set()
            .success(() => {
                redirectTo(urlRedirect);
                swal({
                    type: "success",
                    title: "Organisation créée"
                });

            })
            .error((msg) => {
                swal({
                    type: "error",
                    title: "Une erreur est survenue",
                    text: msg.message
                })

            })
            .post("/organizations/", {organization: e});
    }
    const validate = (e) => {
        const errors = {};
        if (e.organization_name === undefined || (e.organization_name && e.organization_name.trim().length < 1))
            errors.organization_name = "Ce champ ne peut pas être vide"

        if(e.organization_reg_number && !(/^W[0-9]{9}$/.test(e.organization_reg_number)) && !(/^[0-9]{14}$/.test(e.organization_reg_number)))
            errors.organization_reg_number = "Le numéro de SIRET doit contenir 14 chiffres. Le numéro de RNA doit être préfixé de W suivit de 9 chiffres."

        if (e.openInputTVA)
            if(e.organization_tax_id && !(/^FR[0-9]{11}$/.test(e.organization_tax_id)))
                errors.organization_tax_id = "Le numéro de TVA doit être préfixé de FR suivit de 11 chiffres."
        return errors;
    }

    return <Fragment>
        <div className="col-sm-1">
            <button className='btn' data-tippy-content="Créer une organisation" type="button" onClick={() => setIsOpen(true)}>+</button>
        </div>

        <Modal
            ariaHideApp={false}
            onRequestClose={() => setIsOpen(false)}
            style={MODAL_STYLE}
            isOpen={isOpen}>
            {
                <div>
                    <div className="flex flex-space-between-justified">
                        <h2>Créer une organisation</h2>
                    </div>
                    <div className="row m-b-md">
                        <Form
                            onSubmit={onSubmit}
                            validate={validate}
                            render={({handleSubmit, form: {getState}}) => (
                                <section>
                                    <form onSubmit={handleSubmit}>
                                        <div className="panel-body">
                                            <div className="row">
                                                <div className="col-sm-8 form-group">
                                                    <Field
                                                        label="Nom de l'organisation"
                                                        name="organization_name"
                                                        type="text"
                                                        render={Input}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-sm-8 form-group">
                                                    <Field
                                                        label="Numéro de SIRET ou RNA"
                                                        name="organization_reg_number"
                                                        type="text"
                                                        render={Input}
                                                    />
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-sm-8 form-group">
                                                    <Field
                                                        text="Assujetti à la TVA ?"
                                                        name="openInputTVA"
                                                        type="checkbox"
                                                        render={AlertCheckbox}
                                                    />
                                                </div>
                                            </div>
                                            {getState().values && getState().values.openInputTVA ?
                                                <div className="row">
                                                    <div className="col-sm-8 form-group">
                                                        <Field
                                                            label="Numéro de TVA"
                                                            name="organization_tax_id"
                                                            type="text"
                                                            render={Input}
                                                        />
                                                    </div>
                                                </div>
                                                : ''}
                                            <div className="flex flex-end-justified" type="submit">
                                                <button className="btn btn-primary" disabled={!getState().valid}>
                                                    Créer l'organisation
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </section>
                            )}
                        />
                    </div>
                </div>
            }
        </Modal>
    </Fragment>;
}

const MODAL_STYLE = {
    content: {
        margin: "auto",
        maxWidth: "600px",
        height: "600px",
        maxHeight: "720px",
    }
};
export default CreateOrganizationModal;
