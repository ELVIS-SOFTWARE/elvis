import React from "react";
import {Field} from "react-final-form";
import {
    composeValidators,
    required,
    isPhoneNumber,
    isPostalCode,
} from "../../tools/validators";
import Input from "../common/Input";
import InputSelect from "../common/InputSelect";
import SelectSameAs from "./SelectSameAs";
import {toRawPhoneNumber, prettifyPhoneNumber} from "../../tools/format";

const phoneTypes = [
    {value: "portable", label: "Portable"},
    {value: "domicile", label: "Domicile"},
    {value: "travail", label: "Travail"},
];

const familyHasPhones = (family) => {

    if (Array.isArray(family) && family.length > 0) {

        for (const member of family) {
            for (const tel of member.telephones) {
                if (tel.number !== null)
                    return true
            }
        }
    }
}

export const TelephoneFields = ({ignoreValidate, fields, setSameAs, family, currentUser}) => {

    if (!Array.isArray(family)) {
        family = Object.values(family)
    }
    return fields.map((field, i) => (
        <div key={field}>
            {Array.isArray(family) && family.length > 0 && (
                <SelectSameAs
                    family={family}
                    format={obj => {
                        if (Array.isArray(obj)) {
                            const tel = obj.find(tel => tel && tel.label && tel.number)
                            return tel != undefined ? `${tel.label} : ${tel.number}` : undefined
                        }

                        return obj && obj.label && obj.number ? `${obj.label} : ${obj.number}` : undefined

                    }}
                    accessor="telephones"
                    setSameAs={value => setSameAs(i, value)}
                    currentUser={currentUser}
                />
            )}

            <div className="row d-flex align-items-center">
                <div className="col-md-6 pr-0">
                    <label className="small" style={{color: "#003E5C"}}>Téléphone</label><br/>
                    <Field
                        name={`${field}.number`}
                        render={Input}
                        validate={!ignoreValidate && composeValidators(required, isPhoneNumber)}
                        required
                        maxLength={14}
                        parse={prettifyPhoneNumber}
                        format={prettifyPhoneNumber}
                    />
                </div>

                <div className="col">
                    <label className="small" style={{color: "#003E5C"}}>Type</label><br/>
                    <Field
                        name={`${field}.label`}
                        render={InputSelect}
                        validate={!ignoreValidate && required}
                        required
                        options={phoneTypes}
                        className="no inline"
                    />
                </div>

                {fields.length > 1 ? (
                    <div className="col text-right">
                        <button
                            className="btn btn-sm btn-warning"
                            onClick={() => fields.remove(i)}
                        >
                            <i className="fas fa-trash"/>
                            {"supprimer"}
                        </button>
                    </div>
                ) : null}
            </div>


        </div>
    ));
}

export const AddressFields = ({ignoreValidate, fields, setSameAs, family, currentUser}) =>
    fields.map((field, i) => (
        <div key={field}>
            {Array.isArray(family) && family.length > 0 && (
                <SelectSameAs
                    family={family}
                    format={obj => {
                        if (Array.isArray(obj)) {
                            const address = obj.find(address => address && address.street_address && address.postcode && address.city)
                            return address != undefined ? `${address.street_address}, ${address.postcode} ${address.city}` : undefined
                        }

                        return obj && obj.street_address && obj.postcode && obj.city ? `${obj.street_address}, ${obj.postcode} ${obj.city}` : undefined

                    }}
                    accessor="addresses"
                    setSameAs={value => setSameAs(i, value)}
                    currentUser={currentUser}
                />
            )}

                <div className="row d-flex align-items-center mb-4">
                    <div className="col-md-6 pr-0">
                        <label className="small" style={{color: "#003E5C"}}>Adresse</label><br/>
                        <Field
                            name={`${field}.street_address`}
                            render={Input}
                            validate={!ignoreValidate && required}
                            required
                        />
                    </div>

                    <div className="col-md-1 pr-0">
                        <label className="small" style={{color: "#003E5C"}}>Code Postal</label><br/>
                        <Field
                            name={`${field}.postcode`}
                            type="text"
                            render={Input}
                            validate={!ignoreValidate && composeValidators(required, isPostalCode)}
                            required
                        />
                    </div>

                    <div className="col">
                        <label className="small" style={{color: "#003E5C"}}>Ville</label><br/>
                        <Field
                            name={`${field}.city`}
                            render={Input}
                            validate={!ignoreValidate && required}
                            required
                        />
                    </div>
                    {fields.length > 1 ? (
                        <div className="col mt-1 text-right">
                            <button
                                type="button"
                                className="btn btn-sm btn-warning"
                                onClick={() => fields.remove(i)}
                            >
                                <i className="fas fa-trash"/>
                                {" Supprimer"}
                            </button>
                        </div>
                    ) : null}
                </div>
        </div>
    ));
