import React from "react";
import { csrfToken } from "../utils";

const ConfirmLink = ({ label, icon, link, message }) => (
    <form method="POST" action={link} onSubmit={() => window.confirm(message)} className="m-r-xs">
        <input type="hidden" name="authenticity_token" value={csrfToken} />
        <button type="submit" className="btn btn-primary">
            <i className={`fa ${icon}`} /> {label}
        </button>
    </form>
);

export default ConfirmLink;
