import React, {useEffect, useState} from "react";
import PasswordInput from "./PasswordInput";
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
    const [userDetails, setUserDetails] = useState({
        'last_name': '',
        'first_name': '',
        'birthday': '',
        'email': ''
    });

    const [validationErrors, setValidationErrors] = useState({
        user: null,
        email: null,
    });
    const [isChecking, setIsChecking] = useState(false);
    let debounce;


    useEffect(() => {
        if (debounce) {
            clearTimeout(debounce);
        }

        debounce = setTimeout(() => {
            const {
                'last_name': lastName,
                'first_name': firstName,
                'birthday': birthday,
                'email': email
            } = userDetails;

            if (lastName && firstName && birthday && email) {
                console.log("Tous les champs sont remplis:", firstName, lastName, birthday, email);
                checkUniqueness(firstName, lastName, birthday, email);
            }
        }, 1000);
        return () => clearTimeout(debounce);
    }, [userDetails]);

    const checkUniqueness = async (firstName, lastName, birthday, email) => {
        if (isChecking) return;
        setIsChecking(true);

        console.log("Checking uniqueness:", firstName, lastName, birthday, email);

        try {
            const response = await api.set()
                .success((res) => res)
                .error((res) => {
                    console.log("error", res);
                    throw new Error(res);
                })
                .post("/check_uniqueness", {
                        first_name: firstName,
                        last_name: lastName,
                        birthday: birthday,
                        email: email,
                });
            if (response.exists) {
                console.log("User already exists:", response);
                setValidationErrors({
                    user: response.errors.user ? response.errors.user.message : null,
                    email: response.errors.email ? response.errors.email.message : null
                });
                if (onValidationError) onValidationError(response.errors);
            }else {
                setValidationErrors({
                    user: null,
                    email: null
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsChecking(false);
        }
    };

    const handleSubmit = async (values) => {
        setIsSubmitting(true);

        const {first_name, last_name, email, birthday, password, passwordConfirmation} = values;

        console.log("Form Values:", values);

        // api.set()
        //     .success((res) => {
        //         console.log("success", res);
        //     })
        //     .error((res) => {
        //         console.log("error", res);
        //     })
        //     .post("/u", {
        //         user: {
        //             first_name: first_name,
        //             last_name: last_name,
        //             email: email,
        //             birthday: birthday,
        //             password: password,
        //             password_confirmation: passwordConfirmation,
        //             recaptcha_token: recaptchaToken
        //         }
        //     });
    };

    return (
        <Form
            onSubmit={handleSubmit}
            render={({handleSubmit}) => (
                <form onSubmit={handleSubmit}>

                    <Field name="last_name">
                        {({input, meta}) => (
                            <div className="form-group text-left">
                                <label htmlFor="last_name">Votre Nom</label><br/>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="last_name"
                                    onChange={(e) => {
                                        input.onChange(e);
                                        setUserDetails({...userDetails, last_name: e.target.value});
                                    }}
                                />
                                {errors['user[last_name]'] &&
                                    <div className="alert alert-danger">{errors['user[last_name]']}</div>}
                            </div>

                        )}
                    </Field>


                    <Field name="first_name">
                        {({input, meta}) => (
                            <div className="form-group text-left">
                                <label htmlFor="first_name">Votre Prénom</label><br/>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="first_name"
                                    onChange={(e) => {
                                        input.onChange(e);
                                        setUserDetails({...userDetails, first_name: e.target.value});
                                    }}
                                />
                                {errors['user[first_name]'] &&
                                    <div className="alert alert-danger">{errors['user[first_name]']}</div>}
                            </div>
                        )}
                    </Field>

                    <Field name="birthday">
                        {({input, meta}) => (
                            <div className="form-group w-100 text-left">
                                <label htmlFor="birthday">Votre date de naissance</label><br/>
                                <input
                                    type="date"
                                    className="form-control"
                                    id="birthday"
                                    onChange={(e) => {
                                        input.onChange(e);
                                        setUserDetails({...userDetails, birthday: e.target.value});
                                    }}
                                />
                                {errors['user[birthday]'] && <div className="alert alert-danger">{errors['user[birthday]']}</div>}
                                {validationErrors.user && <div className="alert alert-danger">{validationErrors.user}</div>}
                            </div>
                        )}
                    </Field>


                    <Field name="email">
                        {({input, meta}) => (
                            <div className="form-group text-left">
                                <label htmlFor="email">Votre Email</label><br/>
                                <input
                                    type="email"
                                    className="form-control"
                                    id="email"
                                    onChange={(e) => {
                                        input.onChange(e);
                                        setUserDetails({...userDetails, email: e.target.value});
                                    }}
                                />
                                {errors['user[email]'] && <div className="alert alert-danger">{errors['user[email]']}</div>}
                                {validationErrors.email && <div className="alert alert-danger">{validationErrors.email}</div>}
                            </div>
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
