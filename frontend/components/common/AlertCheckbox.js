import React, { Fragment } from "react";
import { MESSAGES } from "../../tools/constants";

const AlertCheckbox = props => {
    const { text, alertType, input, meta } = props;

    const hasError = meta.error && meta.touched;

    return (
        <Fragment>
            <label 
                className={`flex flex-start-justified flex-start-aligned p-sm alert alert-${alertType}`}
            >
                <input
                    {...input}
                    style={{ display: "inline-block", marginRight: "15px" }}
                />
                <p>{text}</p>
            </label>
            {hasError && <p className="text-center text-danger">{MESSAGES[meta.error]}</p>}
        </Fragment>
    );
};

export default AlertCheckbox;
