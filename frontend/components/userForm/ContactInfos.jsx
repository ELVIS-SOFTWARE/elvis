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
            <div className="mt-4">
                <FormSpy
                    subscription={{ values: true }}
                    onChange={props => this.handleChangeInfos(props)} />

                <h3 className="pb-3" style={{color: "#8AA4B1"}}>Coordonnées personnelles du demandeur</h3>

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

                <div className="row">
                    <div className="col-xs-12 col-md-8 col-lg-6 col-xl-4">
                        {displaySameAs && <Fragment>
                            {Array.isArray(values.family) &&
                                values.family.length > 0 && (
                                    <SelectSameAs
                                        family={values.family}
                                        format={obj => `${obj}`}
                                        accessor="email"
                                        setSameAs={value =>
                                            form.change(
                                                "email",
                                                value ? JSON.parse(value) : "",
                                            )
                                        }
                                        currentUser={currentUser}
                                    />
                                )}
                        </Fragment>}
                        <Field
                            label={"Email"}
                            name="email"
                            type="email"
                            render={Input}
                            validate={!ignoreValidate && required}
                            required={!currentUser.is_attached && !ignoreValidate}
                        />
                    </div>
                </div>

                <div className="m-b-md" style={{maxWidth: "600px"}}>
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
                                        value ? JSON.parse(value) : undefined,
                                    )
                                : undefined
                        }
                        currentUser={currentUser}
                    />

                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ backgroundColor: "#00334A", borderRadius: "12px" }}
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
