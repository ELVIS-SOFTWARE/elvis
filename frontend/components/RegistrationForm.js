import React, {useState} from "react";
import PasswordInput from "./PasswordInput";
import UserDetailsInput from "./UserDetailsInput";
import {Form, Field} from "react-final-form";
import * as api from "../tools/api";

export default function RegistrationForm({
                                             errors,
                                             recaptchaKey,
                                             recaptchaToken: initialRecaptchaToken,
                                             onValidationError,
                                             additional_attr
                                         }) {
    const [recaptchaToken, setRecaptchaToken] = useState(initialRecaptchaToken);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (values) => {
        setIsSubmitting(true);

        const {user, password, passwordConfirmation} = values;
        const {first_name, last_name, email, birthday} = user;

        api.set()
            .success((res) => {
                console.log("success", res);
            })
            .error((res) => {
                console.log("error", res);
            })
            .post("/u", {
                user: {
                    first_name: first_name,
                    last_name: last_name,
                    email: email,
                    birthday: birthday,
                    password: password,
                    password_confirmation: passwordConfirmation,
                    recaptcha_token: recaptchaToken
                }
            });
    };

    return (
        <Form
            onSubmit={handleSubmit}
            render={({handleSubmit}) => (
                <form onSubmit={handleSubmit}>

                    <Field name="userInfos">
                        {({input, meta}) => (
                            <UserDetailsInput
                                onChange={input.onChange}
                                errors={errors}
                                onValidationError={onValidationError}
                                recaptchaToken={recaptchaToken}
                            />
                        )}
                    </Field>

                    <Field name="password">
                        {({input, meta}) => (
                            <PasswordInput
                                id="password"
                                name='password'
                                label="Mot de passe"
                                onChange={input.onChange}
                                error={meta.error && meta.touched ? meta.error : errors.password}
                                additional_attr={additional_attr}
                            />
                        )}
                    </Field>

                    <Field name="passwordConfirmation">
                        {({input, meta}) => (
                            <PasswordInput
                                id="password_confirmation"
                                name='passwordConfirmation'
                                label="Confirmer mot de passe"
                                onChange={input.onChange}
                                error={meta.error && meta.touched ? meta.error : errors.password_confirmation}
                            />
                        )}
                    </Field>

                    {recaptchaKey && (
                        <div id="recaptcha-container" style={{display: 'none'}}></div>
                    )}

                    <button type="submit" className="btn btn-primary block full-width m-b" disabled={isSubmitting}>
                        Inscription
                    </button>
                    <a href="/" className="text-primary">Lien vers la page de connexion</a>
                </form>
            )}
        />
    );
}
