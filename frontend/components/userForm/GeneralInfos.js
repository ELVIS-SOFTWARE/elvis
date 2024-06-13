import React, {Fragment} from "react";
import {Field} from "react-final-form";
import {required, isValidAge, composeValidators, isValidNN} from "../../tools/validators";
import Input from "../common/Input";
import InputSelect from "../common/InputSelect";
import {toBirthday, toAge} from "../../tools/format";
import CreateOrganizationModal from "./CreateOrganizationModal";

const genders = [
    {value: "F", label: "Madame"},
    {value: "M", label: "Monsieur"},
    {value: "A", label: "Autre"},
];

const GeneralInfos = ({
                          displayBirthday,
                          displayGender,
                          displayIdentificationNumber,
                          requireIdentificationNumber,
                          birthday,
                          ignoreValidate,
                          organizationOptions,
                          userId
                      }) => (
    <Fragment>
        <div className="row">


            {displayGender && (
                <div className="col mt-3">
                    <Field name="sex" validate={!ignoreValidate && required} required>
                        {({ input, meta }) => (
                            <div>
                                <label className="small" style={{color: "#003E5C"}}>Civilité</label><br/>
                                <div className="d-inline-flex">
                                    {genders.map((gender, index) => (
                                        <div key={index} className="mr-5" style={{color: "#155979", fontWeight: "light"}}>
                                            <Field
                                                name={input.name}
                                                component="input"
                                                type="radio"
                                                value={gender.value}S
                                                checked={gender.value === input.value}
                                                onChange={input.onChange}
                                                className="mr-2"
                                            />
                                            {gender.label}
                                        </div>
                                    ))}
                                </div>
                                {meta.touched && meta.error && <span>{meta.error}</span>}
                            </div>
                        )}
                    </Field>
                </div>
            )}

            <div className="col mt-4">
                <div className="col-xs-12 col-md-6 p-0">
                    <label className="small" style={{color: "#003E5C"}}>Nom</label><br/>
                    <Field
                        name="last_name"
                        type="text"
                        validate={!ignoreValidate && required}
                        required
                        render={Input}
                    />
                </div>

                <div className="col-xs-12 col-md-6 pl-0 pl-md-5 pr-0">
                    <label className="small" style={{color: "#003E5C"}}>Prénom</label><br/>
                    <Field
                        name="first_name"
                        type="text"
                        validate={!ignoreValidate && required}
                        required
                        render={Input}
                    />
                </div>
            </div>


            {displayBirthday && (
                <div className="col-md-6 pr-0">
                    <label className="small" style={{color: "#003E5C"}}>Date de naissance</label><br/>
                    <Field
                        name="birthday"
                        type="date"
                        validate={!ignoreValidate && composeValidators(required, isValidAge)}
                        required
                        render={Input}
                        format={toBirthday}
                        help={birthday ? toAge(birthday) : undefined}
                    />
                </div>
            )}


        </div>

        <div className="row">
        {displayIdentificationNumber &&
                <div className="col-md-6 pr-0">
                    <label className="small" style={{color: "#003E5C"}}>Numéro national d'identification</label><br/>
                    <Field
                        name="identification_number"
                        type="text"
                        validate={!ignoreValidate && (requireIdentificationNumber ? composeValidators(required, isValidNN) : isValidNN)}
                        required={requireIdentificationNumber}
                        placeholder="85 07 30 033 28"
                        mask="99 99 99 999 99"
                        render={Input}
                    />
                </div>
        }

        {ignoreValidate && organizationOptions &&
                <div className="col-md-6 pr-0">
                    <label className="small" style={{color: "#003E5C"}}>Organisation</label><br/>
                    <Field
                        label="Ce contact représente l'organisation"
                        name="organization_id"
                        type="select"
                        validate={!ignoreValidate && required}
                        options={organizationOptions}
                        render={InputSelect}
                        disabled={organizationOptions.length === 0}
                    />
                    <CreateOrganizationModal urlRedirect={`/users/${userId}/edit`}/>
                </div>
        }
        </div>
    </Fragment>
);

export default GeneralInfos;
