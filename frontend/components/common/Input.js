import React from "react";
import {MESSAGES} from "../../tools/constants";
import InputMask from 'react-input-mask';

const Input = props => {
    const {
        label, input, htmlOptions, meta, required, maxLength,
        help, tooltip, disabled, isArea, placeholder, mask
    } = props;

    const hasError = meta.error && meta.touched;

    function renderInput() {
        if (isArea) {
            return <textarea
                className="form-control"
                style={{ minHeight: "100px", borderRadius: "5px", resize: "vertical" }}
                {...input}
                {...htmlOptions}
                maxLength={maxLength}
                disabled={disabled}
                placeholder={placeholder}
            />;
        } else if (mask) {
            return <InputMask
                className="form-control"
                {...input}
                {...htmlOptions}
                mask={mask}
                maxLength={maxLength}
                disabled={disabled}
                placeholder={placeholder}
            />;
        } else {
            return <input
                className="form-control"
                {...input}
                {...htmlOptions}
                maxLength={maxLength}
                disabled={disabled}
                placeholder={placeholder}
            />;
        }
    }

    return (
        <div className={`form-group ${hasError ? "has-error" : ""}`}>
            {label && <label htmlFor={name}>
                {label}
                {required && <span className="text-danger">{" *"}</span>}
            </label>}
            {
                tooltip ?
                    (
                        (tooltip && <div className="input-group">
                            <div className="input-group-addon">
                                <i className="fa fa-exclamation-circle" data-tippy-content={tooltip}></i>
                            </div>
                            {renderInput()}
                        </div>)
                    )
                    :
                    renderInput()
            }

            {help && !hasError ? <p className="help-block">{help}</p> : ''}
            {hasError ? <p className="help-block">{MESSAGES[meta.error] || meta.error}</p> : ''}
        </div>
    );
};

export default Input;
