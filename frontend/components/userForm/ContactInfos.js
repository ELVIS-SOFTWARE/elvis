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

        const family_links_with_user = [...(values.family_links_with_user || [])];

        // Add the current user to the list of family members users to define is_paying column
        family_links_with_user.push({
            id: currentUser.id,
            first_name: currentUser.first_name,
            last_name: currentUser.last_name,
            is_paying_for: currentUser.is_paying

        });

        if(values.payers && values.payers.length > 0)
        {
            values.payers.forEach(payer => {
                const payerUser = family_links_with_user.find(flu => flu.id === payer);
                if(payerUser)
                {
                    payerUser.is_paying_for = true;
                }
            });
        }

        return (
            <div>
                <FormSpy
                    subscription={{ values: true }}
                    onChange={props => this.handleChangeInfos(props)} />

                <h3 className="m-b-md">{"Informations de contact"}</h3>

                <div className="alert alert-warning">
                    <p>
                        Le courriel et le numéro de téléphone renseignés seront
                        utilisés pour le suivi de la demande. C'est pourquoi,
                        nous vous recommandons vivement de renseigner ces
                        informations au maximum afin de faciliter les contacts
                        entre nous.
                    </p>
                </div>

                {canAddContacts ? (
                    <div className="m-b-md">
                        <SelectMultiple
                            title="Payeurs"
                            name="payers"
                            isMulti
                            mutators={this.props.mutators}
                            all_features={family_links_with_user.map(flwu => [`${flwu.first_name} ${flwu.last_name}`, flwu.id])}
                            features={family_links_with_user.filter(flwu => flwu.is_paying_for).map(f => f.id)}
                        />

                        <FamilyMembers
                            firstName={values.first_name}
                            family={values.family}
                            onEdit={onContactEdit}
                            onDelete={onContactDelete}
                        />

                        {/* # display: none */}
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={onContactAdd}
                            style={{
                                display: 'none',
                            }}
                        >
                            <i className="fas fa-plus m-r-xs" />
                            {"Ajouter un contact"}
                        </button>
                    </div>
                ) : null}

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

                <div>
                    <h4>{"Adresses"} <span className="text-danger">{" *"}</span></h4>

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
                        className="btn btn-primary btn-sm m-b-md"
                        onClick={() => push("addresses", { isNew: true })}
                    >
                        <i className="fas fa-plus" /> {"Ajouter une adresse"}
                    </button>
                </div>
            </div>
        );
    }
}

export default ContactInfos;
