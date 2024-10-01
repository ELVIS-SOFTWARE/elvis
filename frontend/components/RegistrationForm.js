import React, {useState, useEffect} from "react";
import PasswordInput from "./PasswordInput";
import UserDetailsInput from "./UserDetailsInput";
import * as api from "../tools/api";
import {Form} from "react-final-form";

export default function RegistrationForm({errors, recaptchaKey, recaptchaToken: initialRecaptchaToken, onValidationError, additional_attr}) {
    const [recaptchaToken, setRecaptchaToken] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formValues, setFormValues] = useState({
        firstName: "",
        lastName: "",
        email: "",
        birthday: "",
        password: "",
        passwordConfirmation: "",
    });

    if (recaptchaKey) {
        setRecaptchaToken(initialRecaptchaToken);
    }

    const handleChange = (e) => {
        setFormValues({
            ...formValues,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        console.log("submitting form");

    }


    return (
        // <Form onSubmit={handleSubmit}>
            <form onSubmit={handleSubmit}>
                <UserDetailsInput
                    onChange={handleChange}
                    onValidationError={onValidationError}
                    recaptchaToken={recaptchaToken}
                />

                <PasswordInput
                    id="password"
                    name='password'
                    label="Mot de passe"
                    onChange={handleChange}
                    error={errors.password}
                    additional_attr={additional_attr}
                />

                <PasswordInput
                    id="password_confirmation"
                    name='passwordConfirmation'
                    label="Confirmer mot de passe"
                    onChange={handleChange}
                    error={errors.password_confirmation}
                />

                {recaptchaKey && (
                    <div id="recaptcha-container" style={{display: 'none'}}></div>
                )}

                <button type="submit" className="btn btn-primary block full-width m-b" disabled={isSubmitting}>
                    Inscription
                </button>
                <a href="/" className="text-primary">Lien vers la page de connexion</a>
            </form>
        // </Form>
    );
}
