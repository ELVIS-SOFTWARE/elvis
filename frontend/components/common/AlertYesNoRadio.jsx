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
        <div className={`p-0 m-0 alert alert-${alertType}`}>
            <div>
                <p>
                    {text}
                </p>
                <div className="d-inline-flex">
                    <label className="form-group flex mr-5 align-items-baseline">
                        <Field
                            name={name}
                            validate={!ignoreValidate && required}
                            type="radio"
                            value="true"
                            component={Radio}
                            style={{marginRight: "10px"}} />
                        <span className="ml-3" style={{color: "rgb(0, 51, 74)", fontWeight: "lighter"}}>Oui</span>
                    </label>
                    <label className="form-group flex align-items-baseline">
                        <Field
                            name={name}
                            validate={!ignoreValidate && required}
                            type="radio"
                            value="false"
                            component={Radio}
                            style={{marginRight: "10px"}} />
                        <span className="ml-3" style={{color: "rgb(0, 51, 74)", fontWeight: "lighter"}}>Non</span>
                    </label>
                </div>


            </div>
            <Field
                name={name}
                subscription={{ touched: true, error: true }}
                render={({ meta: { touched, error } }) =>
                    touched && error ? <span className="text-danger">{MESSAGES[error]}</span> : null
                }/>
        </div>
    );
};

export default AlertYesNoRadio;