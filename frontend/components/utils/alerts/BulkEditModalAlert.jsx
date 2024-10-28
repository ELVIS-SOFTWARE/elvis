import React from "react";

function BulkEditModalAlert() {
    return (
        <div className="m-md alert alert-info alert-dismissable">
            <button
                aria-hidden="true"
                data-dismiss="alert"
                className="close"
                type="button"
            >
                ×
            </button>
            Les champs que vous laissez vides ne seront pas pris en compte
        </div>
    );
}

export default BulkEditModalAlert;
