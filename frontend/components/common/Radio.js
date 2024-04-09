import React from "react";

const Radio = props => {
    const {id, name, label, input, disabled, extraTitle} = props;

    return (
        <div className="form-group">
            {extraTitle && <label>{extraTitle}</label>}
            <div className="radio m-0">
                <input {...input} id={id} name={name} type="radio" disabled={disabled}/>
                <label
                    className="control-label"
                    style={{userSelect: "none"}}
                    htmlFor={id}>
                    {label}
                </label>
            </div>
        </div>
    );
};

export default Radio;
