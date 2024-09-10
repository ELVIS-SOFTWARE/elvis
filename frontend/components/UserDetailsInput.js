import React, { useState, useEffect } from 'react';
import * as api from '../tools/api';

export default function UserDetailsInput({ errors = {}, onValidationError }) {
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

    const handleChange = (e) => {
        setDetails({
            ...details,
            [e.target.name]: e.target.value
        });
    };

    useEffect(() => {
        const checkUniqueness = async () => {
            try {
                const response = await api.set()
                    .success((res) => res)
                    .error((res) => {
                        console.log("error", res);
                        throw new Error("API request failed");
                    })
                    .post("/check_uniqueness", {
                        first_name: details['user[first_name]'],
                        last_name: details['user[last_name]'],
                        birthday: details['user[birthday]'],
                        email: details['user[email]']
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

        const debounceCheckUniqueness = setTimeout(checkUniqueness, 500);

        return () => clearTimeout(debounceCheckUniqueness); // Cleanup debounce
    }, [details]);

    return (
        <div>
            <div className="form-group text-left">
                <label htmlFor="last_name">Votre Nom</label><br/>
                <input
                    type="text"
                    className="form-control"
                    id="last_name"
                    name="user[last_name]"
                    value={details['user[last_name]']}
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
                    value={details['user[first_name]']}
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
                    value={details['user[birthday]']}
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
                    value={details['user[email]']}
                    onChange={handleChange}
                    required
                />
                {errors['user[email]'] && <div className="alert alert-danger">{errors['user[email]']}</div>}
                {validationErrors.email && <div className="alert alert-danger">{validationErrors.email}</div>}
            </div>
        </div>
    );
}
