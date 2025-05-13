import React from "react";
import { MESSAGES } from "../../tools/constants";

const InputColor = props => {
    const {
        input,
        label,
        meta,
        required,
        help,
        tooltip,
        disabled,
    } = props;


    const colorValue = input.value || "#E96469";

    const hasError = meta.error && meta.touched;

    return (
        <div className={`form-group ${hasError ? "has-error" : ""}`}>
            {label && (
                <label className="small d-block mb-1" style={{ color: "#003E5C" }}>
                    {label}
                    {required && <span className="text-danger">{" *"}</span>}
                    {tooltip && (
                        <i
                            className="fa fa-exclamation-circle ms-2"
                            data-tippy-content={tooltip}
                            style={{ cursor: "pointer" }}
                        />
                    )}
                </label>
            )}


            <p className="small text-muted mb-2" style={{ marginTop: "3px" }}>
                Choisissez une couleur pour identifier facilement cette activité sur le planning
            </p>

            <input
                type="color"
                {...input}
                value={colorValue}
                disabled={disabled}
                style={{
                    width: 50,
                    height: 30,
                    padding: 0,
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                }}
            />

            {help && !hasError && <p className="help-block">{help}</p>}
            {hasError && <p className="help-block">{MESSAGES[meta.error] || meta.error}</p>}
        </div>
    );
};

export default InputColor;
