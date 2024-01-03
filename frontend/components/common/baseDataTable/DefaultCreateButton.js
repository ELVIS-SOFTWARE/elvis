import React from 'react';

export default function DefaultCreateButton({ onCreate, label }) {
    return (
        <button type="button" className="btn btn-success pull-right" onClick={onCreate}>
            <i className="fas fa-plus"></i> {label || "Créer"}
        </button>
    );
}

