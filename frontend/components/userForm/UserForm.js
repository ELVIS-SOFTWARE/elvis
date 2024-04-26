import React from "react";
import { Form, FormSpy, Field } from "react-final-form";
import { toast } from "react-toastify";
import arrayMutators from "final-form-arrays";
import Swal from "sweetalert2";

import Modal from "react-modal";
import GeneralInfos from "./GeneralInfos";
import ContactInfos from "./ContactInfos";
import HandicapInfos from "./HandicapInfos";
import GDPR from "./GDPR";

import { MESSAGES } from "../../tools/constants";
import { isEmpty } from "../../tools/validators";
import ContactForm from "./ContactForm";

import * as api from "../../tools/api";
import ImageRight from "./ImageRight";

import { modalStyle } from "../../tools/constants";
import { findFamilyMemberById, selectPhoneType } from "../../tools/mutators";
import NewsLetter from "./NewsLetter";
import { isRadioTrue } from "../utils";
import { toRawPhoneNumber } from "../../tools/format";
import Input from "../common/Input";
import AlertCheckbox from "../common/AlertCheckbox";
import ConsentDocItem from "./ConsentDocItem";
import Payers from "./Payers";

const YES_NO_FIELDS = ["checked_image_right", "checked_newsletter"];

function formatRadioValue(v) {
    switch (v) {
        case true:
            return "true";
        case false:
            return "false";
        default:
            return v;
    }
}

function calculateAge(birthday) {
    const today = new Date();
    const birthDate = new Date(birthday);
    const millisecondsPerYear = 1000 * 60 * 60 * 24 * 365.25;
    return (today - birthDate) / millisecondsPerYear;
}

function userIsMinor(birthday) {
    return calculateAge(birthday) < 18;
}

class UserForm extends React.PureComponent {
    constructor(props) {
        super(props);

        this.handleSubmit = null;
        this.mutators = null;
        this.isValid = false;
        this.isValidID = true;
        this.errors = {};

        this.state = {
            isModalOpen: false,
            selectedFamilyMember: -1,
            familyMember: {},
            requireIdentificationNumber: false,
        };

        this.toggleModal = this.toggleModal.bind(this);
        this.selectFamilyMember = this.selectFamilyMember.bind(this);
    }

    selectFamilyMember(idx = -1, values = {}) {
        this.setState({ selectedFamilyMember: idx, familyMember: values });
    }

    toggleModal() {
        this.setState({ isModalOpen: !this.state.isModalOpen });
    }

    addFamilyMember(values) {
        const toPush = [values];

        const {
            family_member_users: memberUsers,
            inverse_family_members: inverseMembers,
        } = values;

        if (memberUsers && inverseMembers)
            [...memberUsers, ...inverseMembers]
                .forEach(m => {
                    const u = m.user || m.member;
                    // Add member if it isn't already in family
                    if (u && !this.mutators.findFamilyMemberById(u.id))
                        toPush.push(u);
                });

        if (this.mutators !== null)
            this.mutators.concat("family", toPush);
    }

    updateFamilyMember(values) {
        if (this.mutators !== null) {
            this.mutators.update(
                "family",
                this.state.selectedFamilyMember,
                values
            );
        }
    }

    removeFamilyMember(idx, member) {
        if (this.mutators !== null) {
            if (member.id !== undefined && member.link_id !== undefined) {
                api.set()
                    .success(() => this.mutators.remove("family", idx))
                    .del(`/members/${member.link_id}`);
            } else {
                this.mutators.remove("family", idx);
            }
        }
    }

    isValidated() {
        this.handleSubmit();

        if (!this.isValid) {
            let Msg;
            if (!this.isValidID) {
                const redirect = () => {
                    window.location.href = "/u/sign_in"
                }
                Msg = ({ closeToast, toastProps }) => (
                    <div>
                        {MESSAGES.err_is_invalid_id}
                        <button onClick={redirect} className="btn btn-warning">Me rediriger vers la page de Connexion</button>
                    </div>
                )
                toast.error(<Msg />, {
                    autoClose: 5000,
                    closeOnClick: true,
                })
            } else if (this.errors.is_paying) {
                let { initialValues, user } = this.props
                let title = '<h5>Aucun payeur n\' est déclaré pour ' + initialValues.first_name + ' ' + initialValues.last_name + '</h5>';
                let htmltext = '<p>' + initialValues.first_name + ' ' + initialValues.last_name + ', si vous êtes le payeur, merci de cocher la case' + '<br/>'
                    + '<b>"L\'élève est aussi le payeur"</b>' + '<br/>'
                    + '<br/>'
                    + 'Si vous êtes payeur pour ' + user.first_name + ' ' + user.last_name + ', merci de l\'indiquer sur votre profil dans l\'édition du lien familial.' + '<br/>'
                    + '<br/>'
                    + '</p>';

                let confirmtext = 'Redirection vers la page de profil de ' + user.first_name + ' ' + user.last_name;
                let cancelText = 'Retours à la demande d\'inscription';
                Swal.fire({
                    title: title,
                    html: htmltext,
                    allowOutsideClick: false,
                    confirmButtonText: confirmtext,
                    showCancelButton: true,
                    cancelButtonText: cancelText,
                }).then(result => {
                    if (result.value) {
                        window.location.href = "/"
                    }
                })
            } else {
                toast.error(MESSAGES.err_is_invalid, {
                    autoClose: 3000,
                    closeOnClick: true,
                })
            }
            return false;
        }

        return true;
    }

    async checkValidUser(values) {
        if (!this.props.user || this.props.create) {
            this.errors = await api.set()
                .success(data => {
                    this.isValidID = !data;
                    return data === true
                        ? { username: 'name/surname/birthday combinaison doit être identique' }
                        : {}
                })
                .error(errors => console.log(errors))
                .post("/users/exist", {
                    first_name: values.first_name,
                    last_name: values.last_name,
                    birthday: values.birthday,
                })
            return this.errors
        }
        return {}
    }

    validate(values) {
        this.errors = {};
        const { user } = this.props;

        if (user ? user.is_admin : false)
            return this.errors;

        // Check payer
        if (
            (values.payers || []).length === 0
        ) {
            this.errors.payers = "err_must_have_payer";
        }

        // check if rules of procedures checkbox is checked
        if (this.props.isRulesSpecified)
            if (!values.checked_rules)
                this.errors.checked_rules = "err_must_check_rules";

        if (this.props.consent_docs)
        {
            this.props.consent_docs.forEach(doc => {
                const consentvalue = _.get(values.consent_docs, `id_${doc.id}.agreement`);

                if(doc.expected_answer && !consentvalue || consentvalue === undefined)
                {
                    this.errors.consent_docs = this.errors.consent_docs || {};
                    this.errors.consent_docs[`id_${doc.id}`] = this.errors.consent_docs[`id_${doc.id}`] || {};
                    this.errors.consent_docs[`id_${doc.id}`].agreement = doc.expected_answer ? "err_must_check_consent" : "err_must_respond";
                }
            });
        }

        return Object.keys(this.errors).length ? this.errors : this.checkValidUser(values)
    }

    submit(values, form) {
        this.isValid = form.getState().valid;
        if (this.props.displayIdentificationNumber) {
            values.identification_number = values.identification_number || "";
        }

        if (this.isValid) {
            this.props.onSubmit(values);
        }

        return undefined;
    }

    handleChangeInfos({ values }) {
        const { mutators } = this;

        values.telephones && values.telephones.forEach(({ number, label } = {}, index) => {
            if (!number || label)
                return;

            const normalizedNumber = toRawPhoneNumber(number);

            if (normalizedNumber.match(/^0[67]\d{8}$/))
                mutators.selectPhoneType(index, "portable");
            else if (normalizedNumber.match(/^0([1-5]|9)\d{8}$/))
                mutators.selectPhoneType(index, "domicile");
        });

        this.setState({
            requireIdentificationNumber: this.props.displayIdentificationNumber && (values.is_paying || userIsMinor(values.birthday))
        })
    }

    render() {
        const {
            isModalOpen,
            selectedFamilyMember,
            familyMember,
        } = this.state;
        const {
            user,
            initialValues,
            submitting,
        } = this.props;
        const formattedInitialValues = {
            ...initialValues,
        };

        YES_NO_FIELDS.forEach(f => _.set(formattedInitialValues, f, formatRadioValue(_.get(formattedInitialValues, f))));

        return (
            <div className="padding-page application-form">
                <div>
                    <h4 style={{color: "#8AA4B1"}}>INFORMATIONS PERSONNELLES DE {initialValues.first_name.toUpperCase()}</h4>
                    <div>
                        <Form
                            onSubmit={this.submit.bind(this)}
                            mutators={{ ...arrayMutators, findFamilyMemberById, selectPhoneType }}
                            initialValues={formattedInitialValues}
                            validate={this.validate.bind(this)}
                        >
                            {({ handleSubmit, form, values }) => {

                                // Bind handle submit to trigger
                                // Submit inside isValidated()
                                this.handleSubmit = handleSubmit;
                                this.mutators = form.mutators;

                                return (
                                    <form
                                        onSubmit={handleSubmit}
                                        className="user-form">

                                        <FormSpy
                                            subscription={{ values: true }}
                                            onChange={props => this.handleChangeInfos(props)} />

                                        <GeneralInfos
                                            displayBirthday
                                            ignoreValidate={user ? user.is_admin : false}
                                            displayGender
                                            displayIdentificationNumber={this.props.displayIdentificationNumber && this.state.requireIdentificationNumber}
                                            requireIdentificationNumber={this.state.requireIdentificationNumber}
                                            birthday={values.birthday}
                                            organizationOptions={this.props.organizationOptions}
                                            userId={this.props.initialValues.id}
                                        />

                                        <ContactInfos
                                            values={values}
                                            form={form}
                                            displaySameAs
                                            ignoreValidate={user ? user.is_admin : false}
                                            mutators={form.mutators}
                                            canAddContacts
                                            onContactAdd={() => {
                                                this.selectFamilyMember(-1, {});
                                                this.toggleModal();
                                            }}
                                            onContactEdit={idx => {
                                                this.selectFamilyMember(-1, {});
                                                this.toggleModal();
                                            }}
                                            onContactDelete={(idx, member) => {
                                                this.removeFamilyMember(
                                                    idx,
                                                    member
                                                );
                                            }}
                                            currentUser={{ ...initialValues }}
                                        />
                                        <hr />
                                        <HandicapInfos />
                                        <hr />

                                        {/*<GDPR*/}
                                        {/*    schoolName={this.props.schoolName}*/}
                                        {/*    ignoreValidate={user ? user.is_admin : false}*/}
                                        {/*    shouldCheckGdpr={this.props.shouldCheckGdpr} />*/}

                                        {
                                            this.props.consent_docs && this.props.consent_docs.map(doc =>
                                                <ConsentDocItem
                                                    key={doc.id}
                                                    docItem={doc}
                                                    schoolName={this.props.schoolName}
                                                    defaultValue={((initialValues.consent_document_users || []).find(cdu => cdu.consent_document_id === doc.id) || {}).has_consented}
                                                />)
                                        }

                                        {/*<ImageRight*/}
                                        {/*    schoolName={this.props.schoolName}*/}
                                        {/*    ignoreValidate={user ? user.is_admin : false} />*/}
                                        {/*<NewsLetter*/}
                                        {/*    schoolName={this.props.schoolName}*/}
                                        {/*    ignoreValidate={user ? user.is_admin : false} />*/}

                                        {this.props.displaySubmit && (
                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                className="btn btn-primary btn-block"
                                            >
                                                {"Enregistrer"}
                                            </button>
                                        )}
                                    </form>
                                );
                            }}
                        </Form>

                        <Modal
                            isOpen={isModalOpen}
                            style={modalStyle}
                            ariaHideApp={false}
                            contentLabel="Ajouter un contact"
                            onRequestClose={this.toggleModal}
                        >
                            <ContactForm
                                initialValues={familyMember}
                                onClose={() => this.toggleModal()}
                                onSubmit={values => {
                                    if (selectedFamilyMember === -1) {
                                        this.addFamilyMember(values);
                                    } else {
                                        this.updateFamilyMember(values);
                                    }
                                    this.toggleModal();
                                }}
                            />
                        </Modal>
                    </div>
                </div>
            </div>
        );
    }
}

export default UserForm;
