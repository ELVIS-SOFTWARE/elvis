import React from "react";

const Checkbox = props => {
    const {id, label, input, extraTitle} = props;

    return (
        <div className="form-group">
            {extraTitle && <label>{extraTitle}</label>}
            <div className="checkbox checkbox-info m-0 mr-5">
                <input {...input} id={id} type="checkbox"/>
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

export default Checkbox;
