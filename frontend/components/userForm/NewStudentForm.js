import React from "react";
import { csrfToken } from "../utils";
import swal from "sweetalert2";
import { Form, Field, FormSpy } from "react-final-form";
import {
    required,
    isValidAge,
    isValidEmail,
    composeValidators,
    minLength,
} from "../../tools/validators";
import Input from "../common/Input";
import InputSelect from "../common/InputSelect";
import { toBirthday, toAge } from "../../tools/format";
import Checkbox from "../common/Checkbox";

const sexes = [
    { value: "F", label: "Féminin" },
    { value: "M", label: "Masculin" },
    { value: "A", label: "Autre" },
];

export default class NewStudentForm extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { firstName, lastName, onSubmit, onClose } = this.props;
        return (
            <Form
                onSubmit={onSubmit}
                initialValues={this.initialValues}
                render={({ handleSubmit }) => (
                    <form onSubmit={handleSubmit} className="p-lg">
                        <div className="row justify-content-center">
                            <h3 className="m-b-md">
                                Créer un nouvel utilisateur
                            </h3>
                            <Field
                                label="Nom"
                                defaultValue={lastName}
                                name="last_name"
                                type="text"
                                validate={required}
                                required
                                render={Input}
                            />

                            <Field
                                label="Prénom"
                                defaultValue={firstName}
                                name="first_name"
                                type="text"
                                validate={required}
                                required
                                render={Input}
                            />

                            <Field
                                label="Date de naissance"
                                name="birthday"
                                type="date"
                                validate={composeValidators(
                                    required,
                                    isValidAge
                                )}
                                required
                                render={Input}
                                format={toBirthday}
                            />
                            <Field
                                label="Email"
                                name="email"
                                type="email"
                                validate={composeValidators(
                                    required,
                                    isValidEmail
                                )}
                                render={Input}
                            />
                            <Field
                                label="Sexe"
                                name="sex"
                                type="select"
                                validate={required}
                                required
                                render={InputSelect}
                                options={sexes}
                            />

                            <Field name="confirm"
                                   type="checkbox"
                                   label="Envoyer un email de confirmation ?"
                                   id="confirm"
                                   render={Checkbox}/>

                            <div className="pull-right">
                                <button
                                    type="reset"
                                    className="btn btn-md m-sm"
                                    onClick={onClose}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-md"
                                >
                                    Valider
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            />
        );
    }
}
