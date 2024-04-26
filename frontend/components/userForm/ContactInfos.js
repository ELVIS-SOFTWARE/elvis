import React, { Fragment } from "react";
import { Field, FormSpy } from "react-final-form";
import { FieldArray } from "react-final-form-arrays";
import { required } from "../../tools/validators";
import Input from "../common/Input";
import { TelephoneFields, AddressFields } from "./Fields";
import AlertCheckbox from "../common/AlertCheckbox";
import FamilyMembers from "./FamilyMembers";
import SelectSameAs from "./SelectSameAs";
import { toRawPhoneNumber } from "../../tools/format";
import SelectMultiple from "../common/SelectMultiple";

class ContactInfos extends React.PureComponent {
    constructor(props) {
        super(props);
    }

    handleChangeInfos({ values: {
        telephones,
    } }) {
        const { mutators } = this.props;

        telephones && telephones.forEach(({ number, label } = {}, index) => {
            if (!number)
                return;

            const normalizedNumber = toRawPhoneNumber(number);
            let detectedPhoneType = null;

            if (normalizedNumber.match(/^0[67]\d{8}$/))
                detectedPhoneType = "portable";
            else if (normalizedNumber.match(/^0([1-5]|9)\d{8}$/))
                detectedPhoneType = "domicile";

            if (detectedPhoneType && label !== detectedPhoneType)
                detectedPhoneType && mutators.selectPhoneType(index, detectedPhoneType);
        });
    }

    render() {
        const {
            canAddContacts,
            currentUser,
            onContactAdd,
            onContactEdit,
            onContactDelete,
            displaySameAs,
            values,
            form,
            ignoreValidate,
        } = this.props;

        const { push, update } = this.props.mutators;

        return (
            <div className="mt-3">
                <FormSpy
                    subscription={{ values: true }}
                    onChange={props => this.handleChangeInfos(props)} />

                <h4 style={{color: "#8AA4B1"}}>COORDONNEES PERSONNELLES DU DEMANDEUR</h4>

                <div className="col p-0 mb-5">
                    <FieldArray
                        name="addresses"
                        render={props => <AddressFields {...props} ignoreValidate={ignoreValidate} />}
                        family={displaySameAs ? values.family : undefined}
                        validate={!ignoreValidate && required}
                        setSameAs={
                            displaySameAs
                                ? (i, value) =>
                                    update(
                                        "addresses",
                                        i,
                                        value ? JSON.parse(value) : undefined
                                    )
                                : undefined
                        }
                        currentUser={currentUser}
                    />

                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{backgroundColor: "#00334A",borderRadius: "12px"}}
                        onClick={() => push("addresses", { isNew: true })}
                    >
                        <i className="fas fa-plus" /> {"Ajouter une adresse"}
                    </button>
                </div>

                <div className="m-b-md">
                    {displaySameAs && <Fragment>
                        <h4>Email<span className="text-danger">*</span></h4>
                        {Array.isArray(values.family) &&
                            values.family.length > 0 && (
                                <SelectSameAs
                                    family={values.family}
                                    format={obj => `${obj}`}
                                    accessor="email"
                                    setSameAs={value =>
                                        form.change(
                                            "email",
                                            value ? JSON.parse(value) : ""
                                        )
                                    }
                                    currentUser={currentUser}
                                />
                            )}
                    </Fragment>}

                    <Field
                        label={!displaySameAs && "Email"}
                        name="email"
                        type="email"
                        render={Input}
                        validate={!ignoreValidate && required}
                        required={!currentUser.is_attached && !ignoreValidate}
                    />
                </div>

                <div className="m-b-md">
                    <h4>{"Téléphones"} <span className="text-danger">{" *"}</span></h4>

                    <FieldArray
                        name="telephones"
                        render={(props) => <TelephoneFields {...props} ignoreValidate={ignoreValidate} />}
                        family={displaySameAs ? values.family : undefined}
                        validate={!ignoreValidate && required}
                        setSameAs={
                            displaySameAs
                                ? (i, value) =>
                                    update(
                                        "telephones",
                                        i,
                                        value ? JSON.parse(value) : undefined
                                    )
                                : undefined
                        }
                        currentUser={currentUser}
                    />

                    <button
                        type="button"
                        className="btn btn-primary btn-sm m-b-md"
                        onClick={() => push("telephones", undefined)}
                    >
                        <i className="fas fa-plus" /> {"Ajouter un téléphone"}
                    </button>
                </div>


            </div>
        );
    }
}

export default ContactInfos;
