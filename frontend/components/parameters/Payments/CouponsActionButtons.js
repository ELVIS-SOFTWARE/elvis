import React from 'react';

export default function CouponsActionButtons({
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


            {!item.has_any_discount && <button
                className="btn-sm btn-warning"
                onClick={() => onDelete(item)}>
                <i className="fas fa-trash"/>
            </button>}
        </div>
    );
}