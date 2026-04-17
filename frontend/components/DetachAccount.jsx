import React, { Fragment, useEffect, useState } from "react";
import * as api from "../tools/api";
import Modal from "react-modal";
import ContactForm, { familyLinks } from "./userForm/ContactForm";
import { Field, Form } from "react-final-form";
import { required } from "../tools/validators";
import _ from "lodash";
import InlineYesNoRadio from "./common/InlineYesNoRadio";
import Input from "./common/Input";
import { MESSAGES } from "../tools/constants";
import swal from "sweetalert2";

export default function DetachAccount({user, user_id, reload_data})
{
    const [userToDetach, setUserToDetach] = useState(user);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if(!user)
        {
            api.set()
                .success(u => setUserToDetach(u))
                .error(() => setUserToDetach(null))
                .get(`/users/${user_id}/infos`);
        }
    });

    if(userToDetach == null)
    {
        return <Fragment>
            <div className="alert alert-danger">
                Impossible de trouver l'utilisateur
            </div>
        </Fragment>
    }

    function onSubmit(values)
    {
        const sendData = {
            email: values.email,
            //addFamilyLink: addFamilyLink,
            //from,
            sendemail: values.sendemail
        }

        /*if (addFamilyLink)
        {
            sendData.link = values.link;
            sendData.is_paying_for = values.is_paying_for;
            sendData.is_legal_referent = values.is_legal_referent;
        }*/

        api.set()
            .success(() => {
                swal({
                    type: "success",
                    text: "Le compte a bien été détaché"
                }).then(() => reload_data())
            })
            .error(err =>
            {
                swal({
                    title: "Erreur",
                    text: err.message || "Une erreur est survenue",
                    type: "error"
                });
            })
            .del(`/users/${userToDetach.id}/detach`, sendData, {});
    }

    return <Fragment>
        <button className="btn btn-outline btn-danger m-2" onClick={() => setIsModalOpen(true)} type="button">
            Détacher
        </button>

        <Modal className="modal-sm"
            isOpen={isModalOpen}
            onRequestClose={() => setIsModalOpen(false)}
            contentLabel="Détacher le compte"
            appElement={document.body}
        >
            <div className="p-3">
                <div className="m-b-md">
                    <h4>Voulez-vous détacher l'utilisateur·rice {user.first_name} {user.last_name} ?</h4>
                    <p>
                        Ce dernier deviendra indépendant, c'est à dire qu'il pourra se connecter et gérer son compte.
                        Il vous est cependant toujours possible de gérer son compte si vous créez un lien familial avec lui.
                    </p>

                    <p>
                        Pour détacher un compte, vous devez lui ajouter une adresse email (si il n'en a pas déjà une). C'est à cette adresse que sera envoyé le lien lui permettant de se connecter.
                        NB : ce nouvel email ne doit pas être déjà affecté à un autre utilisateur.
                    </p>
                </div>
                <Form
                    onSubmit={onSubmit}
                    initialValues={{email: userToDetach.email, sendemail: false}}
                    >
                    {({handleSubmit, form}) => {

                        return <form onSubmit={handleSubmit}>
                            <div className="row">
                                <div className="col-sm">
                                    <label>email</label>
                                    <Field
                                        name="email"
                                        type="text"
                                        validate={required}
                                        render={Input} />
                                </div>
                            </div>

                            <div className="row m-b-sm">
                                <div className="col-sm">
                                    <div className="form-check">
                                        <Field type="checkbox" name="sendemail" className="form-check-input" component="input"/>
                                        <label className="form-check-label m-l-sm" htmlFor="sendemail">
                                            Envoyer l'email de notification
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-sm-6">
                                    <button className="btn btn-secondary" type="button"
                                            onClick={() => setIsModalOpen(false)}>
                                        Annuler
                                    </button>
                                </div>

                                <div className="col-sm-6">
                                    <button className="btn btn-danger" type="submit">
                                        Détacher
                                    </button>
                                </div>
                            </div>
                        </form>
                    }}
                </Form>
            </div>
        </Modal>
    </Fragment>
}

/*const familyLinkCheckbox = ({ onClick, from }) => {
    let labelMessage = "Ajouter un lien familial";

    if (from === "family_link")
        labelMessage = "Conserver le lien familial";

    return <div className="col-sm">
        <input id="addFamilyLink" type="checkbox" onChange={e => onClick(e.target.checked)} />
        <label htmlFor="addFamilyLink">{labelMessage}</label>
    </div>
}*/

/*const familyLinkForm = ({userToDetach, from, addFamilyLink}) =>
{
    if(from === "family_link" || !addFamilyLink)
        return <Fragment>

        </Fragment>

    return <div className="row">
        <h3>
            Lien familial
        </h3>

        <div className="col-sm">
            <div className="row">
                <div className="col-sm-3">
                    <p className="h5"><b>{userToDetach.first_name} {userToDetach.last_name}</b> est
                    </p>
                </div>
                <div className="col-sm-3">
                    <Field
                        name="link"
                        type="select"
                        render={(props) => <Fragment>
                            <select className="form-control" {...props.input}>
                                <option key={-1} />
                                {props.options.map((opt, i) => (
                                    <option key={i} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            {props.meta.error && props.meta.touched && <p className="help-block text-danger">{MESSAGES[props.meta.error]}</p>}
                        </Fragment>}
                        required={true}
                        validate={required}
                        options={familyLinks.map(link => ({
                            value: link,
                            label: _.capitalize(link),
                        }))} />
                </div>
                <div className="col-sm-3">
                    <p className="h5 text-center">de <b>{userToDetach.attached_to.first_name} {userToDetach.attached_to.last_name}</b></p>
                </div>
            </div>

            <hr />
            <div className="row">
                <h3 className="col-sm-12 m-b-sm">
                    Relation
                    avec {userToDetach.attached_to.first_name} {userToDetach.attached_to.last_name}
                </h3>
            </div>


            <div className="row">
                <InlineYesNoRadio
                    label={<p>{userToDetach.attached_to.first_name} {userToDetach.attached_to.last_name} est payeur
                        pour {userToDetach.first_name} {userToDetach.last_name}</p>}
                    name="is_paying_for"
                    validate={required} />
            </div>

            <div className="row">
                <InlineYesNoRadio
                    label={<p>{userToDetach.attached_to.first_name} {userToDetach.attached_to.last_name} est représentant légal
                        de {userToDetach.first_name} {userToDetach.last_name}</p>}
                    name="is_legal_referent"
                    validate={required} />
            </div>
        </div>
    </div>
}*/