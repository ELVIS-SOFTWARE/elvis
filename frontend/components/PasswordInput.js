
import React, { useState } from 'react';

export default function PasswordInput ({ id, name, label, error, info }) {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    return (
        <div className="form-group text-left">
            <label htmlFor={id}>{label}</label><br />
            <div className="d-inline-flex w-100">
                <input
                    type={passwordVisible ? "text" : "password"}
                    className="form-control"
                    id={id}
                    name={name}
                />
                <button
                    type="button"
                    className="btn btn-icon"
                    onClick={togglePasswordVisibility}
                >
                    <i className={`fas fa-eye${passwordVisible ? '-slash' : ''}`}></i>
                </button>
            </div>
            {info && <p className="form-text text-muted">({info} caractères minimum)</p> }
            {error && <div className="alert alert-danger">{error}</div>}
        </div>
    );
};

