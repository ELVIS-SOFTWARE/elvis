import React from "react";
import { MESSAGES } from "../../tools/constants";
import { Field } from "react-final-form";
import { required } from "../../tools/validators";

const Radio = ({ input, children }) =>
  // input should contain checked value to indicate
  // if the input is checked
  (
    <label>
      <input type="radio" {...input} />
      {children}
    </label>
  );

const AlertYesNoRadio = ({ ignoreValidate, text, alertType, name }) => {
    return (
        <div className={`p-sm alert alert-${alertType}`}>
            <div className="flex flex-start-justified flex-start-aligned">
                <label className="form-group flex m-r-sm">
                    <Field
                        name={name}
                        validate={!ignoreValidate && required}
                        type="radio"
                        value="true"
                        component={Radio}
                        style={{marginRight: "5px"}} />
                    <span>Oui</span>
                </label>
                <label className="form-group flex m-r-sm">
                    <Field
                        name={name}
                        validate={!ignoreValidate && required}
                        type="radio"
                        value="false"
                        component={Radio}
                        style={{marginRight: "5px"}} />
                    <span>Non</span>
                </label>
                <p>
                    {text}
                </p>
            </div>
            <Field
                name={name}
                subscription={{ touched: true, error: true }}
                render={({ meta: { touched, error } }) =>
                    touched && error ? <span className="text-danger text-center">{MESSAGES[error]}</span> : null
                }/>
        </div>
    );
};

export default AlertYesNoRadio;