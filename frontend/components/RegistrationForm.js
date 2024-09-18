import React, {useState, useEffect} from "react";
import PasswordInput from "./PasswordInput";
import UserDetailsInput from "./UserDetailsInput";
import * as api from "../tools/api";

export default function RegistrationForm({errors, recaptchaKey, onValidationError, additional_attr}) {
    const [formValues, setFormValues] = useState({
        'user[first_name]': "",
        'user[last_name]': "",
        'user[email]': "",
        'user[birthday]': "",
        'user[password]': "",
        'user[password_confirmation]': "",
    });

    const [recaptchaToken, setRecaptchaToken] = useState("");
    const [formErrors, setFormErrors] = useState({});
    const [validationErrors, setValidationErrors] = useState({
        user: null,
        email: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (recaptchaKey && window.grecaptcha) {
            window.grecaptcha.ready(() => {
                window.grecaptcha.render('recaptcha-container', {
                    sitekey: recaptchaKey,
                    size: 'invisible',
                    callback: (token) => setRecaptchaToken(token),
                    'expired-callback': () => setRecaptchaToken('')
                });
            });
        }
    }, [recaptchaKey]);


    useEffect(() => {
        const {
            'user[first_name]': firstName,
            'user[last_name]': lastName,
            'user[birthday]': birthday,
            'user[email]': email
        } = formValues;

        if (firstName && lastName && birthday) {
            const checkUniqueness = async () => {
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
                            email: email
                        });

                    if (response.exists) {
                        if (response.field === 'user') {
                            setValidationErrors({
                                user: response.message,
                                email: null
                            });
                        } else if (response.field === 'email') {
                            setValidationErrors({
                                user: null,
                                email: response.message
                            });
                        }
                        if (onValidationError) onValidationError(response.message);
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
                }
            };

            checkUniqueness();
        }
    }, [formValues]);

    const handleChange = (e) => {
        setFormValues({
            ...formValues,
            [e.target.name]: e.target.value
        });
    };


    function handleRecaptchaAndSubmit() {
        return new Promise((resolve, reject) => {
            if (window.grecaptcha) {
                window.grecaptcha.execute().then((token) => {
                    setRecaptchaToken(token);
                    resolve(token);
                }).catch(err => reject(err));
            } else {
                reject("reCAPTCHA not loaded");
            }
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (isSubmitting) return; // Prevent multiple submissions

        setIsSubmitting(true);

        try {
            if (recaptchaKey && !recaptchaToken) {
                await handleRecaptchaAndSubmit();
            }

            // Now that we have the token (if needed), submit the form
            submitForm();
        } catch (error) {
            console.error("Error during reCAPTCHA or form submission:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function submitForm() {
        console.log("Form values:", formValues);

        try {
            const userParams = {
                user: {
                    first_name: formValues['user[first_name]'],
                    last_name: formValues['user[last_name]'],
                    email: formValues['user[email]'],
                    birthday: formValues['user[birthday]'],
                    password: formValues['user[password]'],
                    password_confirmation: formValues['user[password_confirmation]'],
                }
            };

            if (recaptchaToken) {
                userParams.recaptcha_token = recaptchaToken;
            }

            const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

            const response = await fetch("/u", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken
                },
                body: JSON.stringify(userParams)
            });

            if (response.redirected) {
                window.location.href = response.url;
            } else if (response.ok) {
                const res = await response.json();
                console.log("Registration successful:", res);
                window.location.reload();
            } else {
                const res = await response.json();
                console.error("Registration error:", res);
                setFormErrors(res.errors);
            }
        } catch (error) {
            console.error("Error submitting form:", error);
        }
    }


    return (
        <form onSubmit={handleSubmit}>
            <div className="form-group text-left">
                <label htmlFor="last_name">Votre Nom</label><br/>
                <input
                    type="text"
                    className="form-control"
                    id="last_name"
                    name="user[last_name]"
                    value={formValues['user[last_name]']}
                    onChange={handleChange}
                    required
                />
                {errors['user[last_name]'] && <div className="alert alert-danger">{errors['user[last_name]']}</div>}
            </div>

            <div className="form-group text-left">
                <label htmlFor="first_name">Votre Prénom</label><br/>
                <input
                    type="text"
                    className="form-control"
                    id="first_name"
                    name="user[first_name]"
                    value={formValues['user[first_name]']}
                    onChange={handleChange}
                    required
                />
                {errors['user[first_name]'] && <div className="alert alert-danger">{errors['user[first_name]']}</div>}
            </div>

            <div className="form-group w-100 text-left">
                <label htmlFor="birthday">Votre date de naissance</label><br/>
                <input
                    type="date"
                    className="form-control"
                    id="birthday"
                    name="user[birthday]"
                    value={formValues['user[birthday]']}
                    onChange={handleChange}
                    required
                />
                {errors['user[birthday]'] && <div className="alert alert-danger">{errors['user[birthday]']}</div>}
                {validationErrors.user && <div className="alert alert-danger">{validationErrors.user}</div>}
            </div>

            <div className="form-group text-left">
                <label htmlFor="email">Email</label><br/>
                <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="user[email]"
                    value={formValues['user[email]']}
                    onChange={handleChange}
                    required
                />
                {errors['user[email]'] && <div className="alert alert-danger">{errors['user[email]']}</div>}
                {validationErrors.email && <div className="alert alert-danger">{validationErrors.email}</div>}

            </div>

            <PasswordInput
                id="password"
                name='user[password]'
                label="Mot de passe"
                onChange={handleChange}
                error={errors.password}
                additional_attr={additional_attr}
            />

            <PasswordInput
                id="password_confirmation"
                name='user[password_confirmation]'
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
    );
}
