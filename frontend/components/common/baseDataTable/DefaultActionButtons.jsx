import React from 'react';

export default function DefaultActionButtons({
                                                 item: item,
                                                 onEdit,
                                                 onDelete
}) {
    return (
        <div className="btn-wrapper">
            <button
                className="btn-sm btn-primary m-r-sm"
                onClick={() => onEdit(item)}>
                <i className="fas fa-edit"/>
            </button>

            <button
                className="btn-sm btn-warning"
                onClick={() => onDelete(item)}>
                <i className="fas fa-trash"/>
            </button>
        </div>
    );
}