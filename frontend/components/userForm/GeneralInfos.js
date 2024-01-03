import React, {Fragment} from "react";
import {Field} from "react-final-form";
import {required, isValidAge, composeValidators, isValidNN} from "../../tools/validators";
import Input from "../common/Input";
import InputSelect from "../common/InputSelect";
import {toBirthday, toAge} from "../../tools/format";
import CreateOrganizationModal from "./CreateOrganizationModal";

const genders = [
    {value: "F", label: "Féminin"},
    {value: "M", label: "Masculin"},
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
        <h3 className="m-b-md">Identité du contact</h3>
        <div className="row">
            <div className="col-lg-10">
                <Field
                    label="Nom"
                    name="last_name"
                    type="text"
                    validate={!ignoreValidate && required}
                    required
                    render={Input}
                />
            </div>

            <div className="col-lg-10">
                <Field
                    label="Prénom"
                    name="first_name"
                    type="text"
                    validate={!ignoreValidate && required}
                    required
                    render={Input}
                />
            </div>

            {displayBirthday && (
                <div className="col-lg-10">
                    <Field
                        label="Date de naissance"
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

            {displayGender && (
                <div className="col-sm-3">
                    <Field
                        label="Genre"
                        name="sex"
                        type="select"
                        validate={!ignoreValidate && required}
                        required
                        render={InputSelect}
                        options={genders}
                    />
                </div>
            )}
        </div>

        {displayIdentificationNumber &&
            <div className="row">
                <div className="col-sm-3">
                    <Field
                        label="Numéro national d'identification"
                        name="identification_number"
                        type="text"
                        validate={!ignoreValidate && (requireIdentificationNumber ? composeValidators(required, isValidNN) : isValidNN)}
                        required={requireIdentificationNumber}
                        placeholder="85 07 30 033 28"
                        mask="99 99 99 999 99"
                        render={Input}
                    />
                </div>
            </div>
        }

        {ignoreValidate && organizationOptions &&
            <div className="row">
                <div className="col-sm-4">
                    <Field
                        label="Ce contact représente l'organisation"
                        name="organization_id"
                        type="select"
                        validate={!ignoreValidate && required}
                        options={organizationOptions}
                        render={InputSelect}
                        disabled={organizationOptions.length === 0}

                    />
                </div>
                <CreateOrganizationModal urlRedirect={`/users/${userId}/edit`}/>
            </div>
        }
    </Fragment>
);

export default GeneralInfos;
