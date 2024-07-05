import React from "react";
import {Form, Field, FormSpy} from "react-final-form";
import arrayMutators from "final-form-arrays";
import Switch from "react-switch";
import _, {values} from "lodash";
import moment from "moment";

import GeneralInfos from "./GeneralInfos";
import ContactInfos from "./ContactInfos";
import InputSelect from "../common/InputSelect";

import * as api from "../../tools/api";
import {required} from "../../tools/validators";
import {fullname, toLocaleDate, toDate} from "../../tools/format";
import {changeUser, selectPhoneType, changeRelationshipDirection} from "../../tools/mutators";
import InlineYesNoRadio from "../common/InlineYesNoRadio";
import Checkbox from "../common/Checkbox";

export const familyLinks = [
    "père",
    "mère",
    "grand-père",
    "grand-mère",
    "frère",
    "soeur",
    "enfant",
    "petit-enfant",
    "époux",
    "autre",
];

const YES_NO_FIELDS = ["is_paying_for", "is_legal_referent", "is_accompanying", "is_to_call"];

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

class ContactForm extends React.PureComponent {
    constructor(props) {
        super(props);

        this.handleContactInfosChange = _.debounce(this.handleContactInfosChange, 300);

        this.state = {
            suggestedUsers: null,
            selectedUserMatch: null,
            isUserSearchOver: props.initialValues.id !== null && props.initialValues.id !== undefined,
            first_name: props.initialValues.first_name,
            last_name: props.initialValues.last_name,
            birthday: props.initialValues.birthday,
            is_inverse: props.initialValues.is_inverse,
            is_attached: props.initialValues.is_attached,
        };

        this.showFamilyLinkInfos = props.showFamilyLinkInfos == undefined ? true : props.showFamilyLinkInfos;
    }

    handleContactInfosChange({
                                 values: {
                                     first_name,
                                     last_name,
                                     birthday,
                                 }
                             }) {
        this.setState({
            ...this.state,
            first_name,
            last_name,
            birthday,
        })

        /*this.props.initialValues.first_name = first_name;
        this.props.initialValues.last_name = last_name;
        this.props.initialValues.birthday = birthday;*/

        const {current_user, user_linked} = this.props;
        const {isUserSearchOver} = this.state;

        // Admin must enter at least 2 characters for last_name or first_name to trigger search
        // Simple user must give input for first_name, last_name and birthday fields
        if (isUserSearchOver ||
            (current_user && current_user.is_admin && (!first_name || first_name.length < 2) && (!last_name || last_name.length < 2)) ||
            ((!current_user || !current_user.is_admin) && (!first_name || !last_name || !birthday)))
            return;

        // There are enough infos for admin search
        // Now check if the three fields were given, it means that search is over
        if (current_user && current_user.is_admin && (first_name && first_name.length > 0) && (last_name && last_name.length > 0) && birthday) {
            this.setState({
                isUserSearchOver: true,
                is_attached: true
            });

            this.mutators.changeUser({
                ...this.props.initialValues,
                first_name: this.state.first_name,
                last_name: this.state.last_name,
                birthday: this.state.birthday,
                is_attached: true, //this.state.is_attached, // 12/03/24 ==> attached by default if no user match
            });

            return;
        }

        api
            .set()
            .success(suggestedUsers => {
                this.setState({
                    suggestedUsers: suggestedUsers,
                    selectUserMatch: null
                });
            })
            .post("/users/search", {
                first_name,
                last_name,
                birthday: birthday,
            });
    }

    selectUserMatch(idx) {
        this.setState({
            selectedUserMatch: idx,
        });
    }

    validateUserMatch() {
        const selectedUser = this.state.suggestedUsers[this.state.selectedUserMatch];

        this.mutators.changeUser({
            ...selectedUser,
            is_inverse: this.state.is_inverse,
            is_attached: false
        });
        this.setState({
            isUserSearchOver: true,
            suggestedUsers: null,
            is_attached: false,
        });
    }

    disabledUserSearch() {
        this.mutators.changeUser({
            ...this.props.initialValues,
            first_name: this.state.first_name,
            last_name: this.state.last_name,
            birthday: this.state.birthday,
            is_attached: true, //this.state.is_attached, // 12/03/24 ==> attached by default if no user match
        })
        this.setState({isUserSearchOver: true, is_attached: true});
    }

    render() {
        const {initialValues, onSubmit, user_linked, current_user, onClose} = this.props;
        const {
            suggestedUsers,
            isUserSearchOver,
            selectedUserMatch,
        } = this.state;

        const formattedInitialValues = {
            ...initialValues,
        };

        let [user_fname, user_lname, member_fname, member_lname] = this.state.is_inverse ?
            [(user_linked || {}).first_name, [user_linked || {}].last_name, this.state.first_name, this.state.last_name]
            : [this.state.first_name, this.state.last_name, [user_linked || {}].first_name, [user_linked || {}].last_name]

        const FamilyLinkInputSelect = (props) => {
            const {input, meta, required, label, options} = props;
            const hasError = meta.error && meta.touched;

            return (
                <div className={`col-xs-12 form-group ${hasError ? "has-error" : ""}`}>
                    <h3>
                        Lien familial
                        {required && <span className="text-danger">{" *"}</span>}
                    </h3>

                    <div className="row">
                        <div className="col-sm-3">
                            <p className="h5"><b>{this.state.first_name} {this.state.last_name}</b> est </p>
                        </div>
                        <div className="col-sm-3">
                            <select className="form-control" {...input}>
                                <option key={-1}/>
                                {options.map((opt, i) => (
                                    <option key={i} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-sm-3">
                            <p className="h5 text-center">de <b>{user_linked.first_name} {user_linked.last_name}</b></p>
                        </div>
                        {hasError && <p className="help-block">{MESSAGES[meta.error]}</p>}
                    </div>
                </div>
            );
        }

        const FamilyIsInverseButton = (props) => {
            const {input, meta, onChange} = props
            return <div
                className="col-sm-12 m-b-sm"
                style={current_user.is_admin ? {} : {
                    display: 'none',
                }}
                onClick={(val, prevVal) => {
                    onChange(val, prevVal)
                }}
            >

                <p style={{cursor: 'pointer'}}>Vous pouvez modifier le sens de la relation &nbsp;
                    <span className="btn m-r-sm btn-primary"><i className="fas fa-solid fa-arrow-left"></i><i
                        className="fas fa-arrow-right"></i>
                    </span>
                </p>
            </div>
        }

        YES_NO_FIELDS.forEach(f => _.set(formattedInitialValues, f, formatRadioValue(_.get(formattedInitialValues, f))));

        return (
            <div>
                <hr/>
                <Form
                    onSubmit={onSubmit}
                    mutators={{...arrayMutators, changeUser, selectPhoneType, changeRelationshipDirection}}
                    initialValues={formattedInitialValues || {}}
                >
                    {({handleSubmit, form}) => {
                        this.mutators = form.mutators

                        return <form onSubmit={handleSubmit} className="user-form">
                            <FormSpy
                                subscription={{values: true}}
                                onChange={props => this.handleContactInfosChange(props)}/>

                            <GeneralInfos
                                ignoreValidate={false}
                                // displayGender
                                displayBirthday/>

                            {/* user_linked && !form.getState().values.id && <div>
                                <Checkbox
                                    name="is_attached"
                                    id="is_attached"
                                    label={`"Est rattaché à ${user_linked.first_name} ${user_linked.last_name}`}
                                    input={{
                                        value: this.state.is_attached,
                                        onChange: (e) => {
                                            this.setState({ is_attached: e.target.checked});
                                            this.mutators.changeUser({
                                                ...this.props.initialValues,
                                                first_name: this.state.first_name,
                                                last_name: this.state.last_name,
                                                birthday: this.state.birthday,
                                                is_attached: e.target.checked,
                                            });
                                        }
                                    }} />
                            </div>*/}

                            <hr/>

                            {
                                !isUserSearchOver && suggestedUsers && <div>
                                    {
                                        suggestedUsers.length ? <div>
                                                <div className="alert alert-info m-b-sm">
                                                    Ce membre existe déjà dans la base de données :
                                                </div>
                                                <div className="list-group">
                                                    {suggestedUsers.map((u, i) => <button
                                                        type="button"
                                                        // onClick={() => this.selectUserMatch(i)} key={i}
                                                        disabled
                                                        className={`list-group-item ${i === selectedUserMatch ? "active" : ""
                                                        }`}>
                                                        <b>{fullname(u)}</b>
                                                        {` né(e) le ${toLocaleDate(
                                                            toDate(u.birthday)
                                                        )}, Adhérent #${u.adherent_number}`}
                                                    </button>)}
                                                </div>
                                            </div> :
                                            null
                                    }

                                    <div className="d-flex justify-content-between" style={{marginBottom: "20px"}}>
                                        {/*<button type="button" className="btn btn-primary"*/}
                                        {/*        onClick={() => this.validateUserMatch()}*/}
                                        {/*        disabled={selectedUserMatch === null}>*/}
                                        {/*    Utiliser ce profil*/}
                                        {/*</button>*/}
                                        {/*<button*/}
                                        {/*    onClick={onClose}*/}
                                        {/*    type="button"*/}
                                        {/*    className="btn btn-sm">*/}
                                        {/*    <i className="fas fa-times m-r-sm"></i>*/}
                                        {/*    Annuler*/}
                                        {/*</button>*/}
                                        {/*<button type="button" className="btn btn-primary"*/}
                                        {/*        onClick={() => this.disabledUserSearch()}>*/}
                                        {/*    Valider*/}
                                        {/*</button>*/}
                                    </div>
                                </div>
                            }

                            {
                                isUserSearchOver && this.showFamilyLinkInfos && <React.Fragment>
                                    <div className="row">
                                        <Field
                                            name="link"
                                            type="select"
                                            render={FamilyLinkInputSelect}
                                            required={!current_user.is_admin}
                                            validate={!current_user.is_admin && required}
                                            options={familyLinks.map(link => ({
                                                value: link,
                                                label: _.capitalize(link),
                                            }))}/>
                                    </div>

                                    <hr/>
                                    <div className="row">
                                        <h3 className="col-sm-12 m-b-sm">
                                            Relation avec {user_linked.first_name} {user_linked.last_name}
                                        </h3>
                                        <Field
                                            name="is_inverse"
                                            render={FamilyIsInverseButton}
                                            type="checkbox"
                                            onChange={(e) => {
                                                this.setState({is_inverse: !this.state.is_inverse});
                                                this.mutators.changeRelationshipDirection(!this.state.is_inverse);
                                            }}
                                        />
                                    </div>


                                    <div className="row">
                                        <InlineYesNoRadio
                                            label={<p>{user_fname} {user_lname} est payeur
                                                pour {member_fname} {member_lname}</p>}
                                            name="is_paying_for"
                                            validate={!user_linked.is_admin && required}/>
                                    </div>

                                    <div className="row">
                                        <InlineYesNoRadio
                                            label={<p>{user_fname} {user_lname} est représentant légal
                                                de {member_fname} {member_lname}</p>}
                                            name="is_legal_referent"
                                            validate={!current_user.is_admin && required}/>
                                    </div>
                                    {current_user.is_admin && <div className="row">
                                        <InlineYesNoRadio
                                            label={<p>{user_fname} {user_lname} est la première personne à contacter
                                                pour {member_fname} {member_lname}</p>}
                                            name="is_to_call"
                                            validate={!current_user.is_admin && required}/>
                                    </div>}
                                    {current_user.is_admin && <div className="row">
                                        <InlineYesNoRadio
                                            label={<p>{user_fname} {user_lname} accompagne à
                                                l'école {member_fname} {member_lname}</p>}
                                            name="is_accompanying"
                                            validate={!current_user.is_admin && required}/>
                                    </div>}

                                    <hr/>

                                    <ContactInfos
                                        ignoreValidate={current_user.is_admin}
                                        mutators={form.mutators}
                                        canAddContacts={false}
                                        displaySameAs
                                        values={{
                                            family: [
                                                ...user_linked.family_links_with_user,
                                            ]
                                        }}
                                        form={form}
                                        currentUser={{...initialValues}}
                                        // suggestedUsers={!ignoreUserSearch && suggestedUsers}
                                        // selectedUserMatch={selectedUserMatch}
                                        // selectUserMatch={i => this.selectUserMatch(i)}
                                        // validateUserMatch={() => this.validateUserMatch()}
                                        // disabledUserSearch={() => this.disabledUserSearch()}
                                    />

                                    <hr/>

                                </React.Fragment>
                            }
                            <div className="flex flex-space-between-justified">
                                <button
                                    onClick={onClose}
                                    type="button"
                                    className="btn btn-sm">
                                    <i className="fas fa-times m-r-sm"></i>
                                    Annuler
                                </button>
                                {
                                    isUserSearchOver &&
                                    <button
                                        type="submit"
                                        className="btn btn-sm btn-primary">
                                        <i className="fas fa-check m-r-sm"></i>
                                        {"Confirmer"}
                                    </button>
                                }
                                {
                                    !isUserSearchOver && suggestedUsers &&
                                    <button type="button"
                                            className="btn btn-primary"
                                            disabled = {suggestedUsers.length}
                                            onClick={() => this.disabledUserSearch()}>
                                        Valider
                                    </button>
                                }
                            </div>
                        </form>
                    }}
                </Form>
            </div>
        );
    }
}

export default ContactForm;
