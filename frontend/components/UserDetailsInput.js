import React, {useState, useEffect} from 'react';
import * as api from '../tools/api';
import {Field} from "react-final-form";

export default function UserDetailsInput({errors = {}, onValidationError, recaptchaToken}) {
    const [details, setDetails] = useState({
        'user[last_name]': '',
        'user[first_name]': '',
        'user[birthday]': '',
        'user[email]': ''
    });
    const [validationErrors, setValidationErrors] = useState({
        user: null,
        email: null
    });
    const [isChecking, setIsChecking] = useState(false);
    let debounce


    const handleChange = (e) => {
        setDetails({
            ...details,
            [e.target.name]: e.target.value
        });
    };

    useEffect(() => {
        if (debounce) {
            clearTimeout(debounce);
        }

        debounce = setTimeout(() => {
            const {
                'user[first_name]': firstName,
                'user[last_name]': lastName,
                'user[birthday]': birthday,
                'user[email]': email
            } = details;

            if (firstName && lastName && birthday && email) {
                // if (!recaptchaToken) {
                //     console.error("reCAPTCHA token is missing");
                //     return;
                // }
                checkUniqueness(firstName, lastName, birthday, email, recaptchaToken);
            }
        }, 1000);

        return () => clearTimeout(debounce);
    }, [details, recaptchaToken]);


    const checkUniqueness = async (firstName, lastName, birthday, email, recaptchaToken) => {
        if (isChecking) return;
        setIsChecking(true);

        try {
            const response = await api.set()
                .success((res) => res)
                .error((res) => {
                    console.log("error", res);
                    throw new Error("API request failed");
                })
                .post("/check_uniqueness", {
                    first_name: firstName,
                    last_name: lastName,
                    birthday: birthday,
                    email: email,
                    recaptchaToken: recaptchaToken
                });

            if (response.exists) {
                setValidationErrors({
                    user: response.errors.user ? response.errors.user.message : null,
                    email: response.errors.email ? response.errors.email.message : null
                });
                if (onValidationError) onValidationError(response.errors);
            } else {
                setValidationErrors({
                    user: null,
                    email: null
                });
            }
        } catch (error) {
            console.error("Error checking uniqueness:", error);
            setValidationErrors({
                user: "Une erreur est survenue",
                email: null
            });
        } finally {
            setIsChecking(false);
        }
    };


    return (
        <div>
            <Field name="user[last_name]">
                {({input, meta}) => (
                    <div className="form-group text-left">
                        <label htmlFor="last_name">Votre Nom</label><br/>
                        <input
                            type="text"
                            className="form-control"
                            id="last_name"
                            {...input}
                            required
                        />
                        {errors['user[last_name]'] &&
                            <div className="alert alert-danger">{errors['user[last_name]']}</div>}
                    </div>
                )}
            </Field>

            <Field name="user[first_name]">
                {({input, meta}) => (
                    <div className="form-group text-left">
                        <label htmlFor="first_name">Votre Prénom</label><br/>
                        <input
                            type="text"
                            className="form-control"
                            id="first_name"
                            {...input}
                            required
                        />
                        {errors['user[first_name]'] &&
                            <div className="alert alert-danger">{errors['user[first_name]']}</div>}
                    </div>
                )}
            </Field>

            <Field name="user[birthday]">
                {({input, meta}) => (
                    <div className="form-group w-100 text-left">
                        <label htmlFor="birthday">Votre date de naissance</label><br/>
                        <input
                            type="date"
                            className="form-control"
                            id="birthday"
                            {...input}
                            required
                        />
                        {errors['user[birthday]'] &&
                            <div className="alert alert-danger">{errors['user[birthday]']}</div>}
                    </div>
                )}
            </Field>

            <Field name="user[email]">
                {({input, meta}) => (
                    <div className="form-group text-left">
                        <label htmlFor="email">Email</label><br/>
                        <input
                            type="email"
                            className="form-control"
                            id="email"
                            {...input}
                            required
                        />
                        {errors['user[email]'] && <div className="alert alert-danger">{errors['user[email]']}</div>}
                    </div>
                )}
            </Field>
        </div>
    );
}
