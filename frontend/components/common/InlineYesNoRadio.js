import React from "react";
import { Field } from "react-final-form";
import { MESSAGES } from "../../tools/constants";

export default function InlineYesNoRadio({label, ...fieldProps}) {
    const yesId = fieldProps.name + "-yes";
    const noId = fieldProps.name + "-no";

    return <div>
        <div className="yes-no-group">
            <label className="m-r-sm col-sm-4">{label}</label>
            <label className="yes-no-radio yes">
                <Field
                    {...fieldProps}
                    id={yesId}
                    type="radio"
                    component="input"
                    value="true" />
                <label htmlFor={yesId}>Oui</label>
            </label>
            <label className="yes-no-radio no">
                <Field
                    {...fieldProps}
                    id={noId}
                    type="radio"
                    component="input"
                    value="false" />
                <label htmlFor={noId}>Non</label>
            </label>
        </div>
        <Field
            name={fieldProps.name}
            subscription={{ touched: true, error: true }}
            render={({ meta: { touched, error } }) =>
                touched && error ? <div className="text-danger text-center">{MESSAGES[error]}</div> : null
            }/>
    </div>
}