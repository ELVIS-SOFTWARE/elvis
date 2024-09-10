import React, { useState } from 'react';

export default function UserDetailsInput({ errors = {} }) {
    const [details, setDetails] = useState({
        'user[last_name]': '',
        'user[first_name]': '',
        'user[birthday]': '',
        'user[email]': ''
    });

    const handleChange = (e) => {
        setDetails({
            ...details,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div>
            <div className="form-group text-left">
                <label htmlFor="last_name">Votre Nom</label><br/>
                <input
                    type="text"
                    className="form-control"
                    id="last_name"
                    name="user[last_name]"
                    value={details.last_name}
                    onChange={handleChange}
                    required
                />
                {errors.last_name && <div className="alert alert-danger">{errors.last_name}</div>}
            </div>

            <div className="form-group text-left">
                <label htmlFor="first_name">Votre Prénom</label><br/>
                <input
                    type="text"
                    className="form-control"
                    id="first_name"
                    name="user[first_name]"
                    value={details.first_name}
                    onChange={handleChange}
                    required
                />
                {errors.first_name && <div className="alert alert-danger">{errors.first_name}</div>}
            </div>

            <div className="form-group w-100 text-left">
                <label htmlFor="birthday">Votre date de naissance</label><br/>
                <input
                    type="date"
                    className="form-control"
                    id="birthday"
                    name="user[birthday]"
                    value={details.birthday}
                    onChange={handleChange}
                    required
                />
                {errors.birthday && <div className="alert alert-danger">{errors.birthday}</div>}
            </div>

            <div className="form-group text-left">
                <label htmlFor="email">Email</label><br/>
                <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="user[email]"
                    value={details.email}
                    onChange={handleChange}
                    required
                />
                {errors.email && <div className="alert alert-danger">{errors.email}</div>}
            </div>
        </div>
    );
}
