import React, {forwardRef, Fragment, useEffect, useImperativeHandle, useState} from "react";
import * as api from "../../tools/api";
import swal from "sweetalert2";
import ToggleButtonGroup from "../ToggleButtonGroup";
import _ from "lodash";
import ContactForm from "../userForm/ContactForm";
import Modal from "react-modal";
import SelectMultiple from "../common/SelectMultiple";
import CreatableSelect from "react-select/lib/Creatable";
import {Field, Form} from "react-final-form";
import Input from "../common/Input";
import {required} from "../../tools/validators";
import arrayMutators from "final-form-arrays";
import UserAvatar from "../UserAvatar";

/**
 * Class used because stepzilla doesn't support functional components for validation
 * (call to isvalidated)
 */
export default class WizardUserSelectMember extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            members: [],
            selected: 0,
            isModalOpen: false,
            error: {},
            showError: false,
        };

        this.getErrors = this.getErrors.bind(this);
        this.updateMembersData = this.updateMembersData.bind(this);
        this.onFamilyLinkSelectorChange = this.onFamilyLinkSelectorChange.bind(this);
    }

    updateMembersData() {
        api.set()
            .success((data) => {
                this.setState({members: data});
            })
            .error(error => {
                console.error(error);

                swal({
                    title: "Erreur",
                    text: "Une erreur est survenue lors de la récupération des membres",
                    type: "error",
                    confirmButtonText: "Fermer",
                });
            })
            .get(`/users/${this.props.user.id}/family`, {season: this.props.season.id});
    }

    componentDidMount() {
        this.updateMembersData();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const errors = this.getErrors();

        if (!_.isEqual(errors, this.state.error))
            this.setState({error: errors});

        if (this.props.season.id !== prevProps.season.id)
            this.updateMembersData();
    }

    onAddMember(values)
    {
        const newMembers = _.cloneDeep(this.state.members);

        const userToAdd = {
            ...values,
            full_name: `${values.first_name} ${values.last_name}`,
            family_links_with_user: [],
            availabilities: [],
            addresses: [],
            telephones: [],
            attached_to_id: values.id ? undefined : this.props.user.id, // do not attach if user already exists
        };

        // add the new member if it doesn't exist
        if(newMembers.filter(m => (m.id != undefined && m.id === userToAdd.id) || (m.first_name === userToAdd.first_name && m.last_name === userToAdd.last_name && m.birthday === userToAdd.birthday)).length === 0)
            newMembers.push(userToAdd);

        this.setState({
            members: newMembers,
            selected: newMembers.length - 1,
            isModalOpen: false,
        });
    }

    familyLinkWithUserToOption(m) {
        return {
            value: m.id,
            label: `${m.first_name} ${m.last_name}`,
            is_legal_referent: m.is_legal_referent,
            is_to_call: m.is_to_call,
            is_accompanying: m.is_accompanying,
        };
    }

    getErrors() {
        const error = {};

        if (this.state.members.length === 0 || this.state.selected === undefined || this.state.members[this.state.selected] === undefined)
            error.members = "Veuilez sélectionner un membre";

        if (Object.keys(error).length === 0 && this.state.members[this.state.selected].id === this.props.user.id)
            return {};

        const familyMemberUserOptionForSelection = this.state.members && this.state.members.length > 0 && this.state.members[this.state.selected] ? this.state.members[this.state.selected]
            .family_links_with_user
            .map(this.familyLinkWithUserToOption) : [];

        if (familyMemberUserOptionForSelection.filter(fl => fl.is_legal_referent).length === 0)
            error.legal_referent = "Veuillez sélectionner un représentant légal";

        return error;
    }

    /**
     * called by stepzilla to check if the form is validated
     * @returns {boolean}
     */
    isValidated() {
        const error = this.getErrors();

        if (Object.keys(error).length > 0) {
            this.setState({error, showError: true});
            return false;
        }

        this.props.onSelect(this.state.members[this.state.selected])

        return true;
    }

    completeUserWithOther(user, otherUser) {
        user.id = otherUser.id;
        user.is_inverse = false;
        user.member_id = otherUser.id;
        user.first_name = otherUser.first_name;
        user.last_name = otherUser.last_name;
        user.sex = otherUser.sex;
        user.telephones = otherUser.telephones;
        user.addresses = otherUser.addresses;
        user.email = otherUser.email;
        user.birthday = otherUser.birthday;
    }

    onFamilyLinkSelectorChange(values, fieldForSelection) {
        const {members, selected} = this.state;

        if (values.value)
            values = [values];

        this.setState({
            members: members.map((m, i) => i === selected ? {
                ...m,
                family_links_with_user: [
                    ...m.family_links_with_user.filter(fl => !values.map(v => v.value).includes(fl.member_id)).map(fl => ({
                        ...fl,
                        [fieldForSelection]: false
                    })),
                    ...values.map(v => {
                        const otherUser = members.find(member => member.id === v.value);

                        let res = {
                            ...(m.family_links_with_user.find(fl => fl.member_id === otherUser.id) || {}),
                            [fieldForSelection]: true,
                        };

                        if (res.member_id === undefined) {
                            res.user_id = m.id;
                            this.completeUserWithOther(res, otherUser);
                        }

                        return res;
                    })
                ]
            } : m),
        })
    }

    render() {
        const {user} = this.props;
        const {members, selected, isModalOpen} = this.state;

        const virtualFamilyLinks = members.filter(m => m.id && m.id !== (members[selected] || {}).id).map(m => {
            const familyLinkToUse = ((members[selected] || {}).family_links_with_user || []).find(fl => fl.member_id === m.id);

            return {
                id: m.id,
                first_name: m.first_name,
                last_name: m.last_name,
                is_legal_referent: familyLinkToUse ? familyLinkToUse.is_legal_referent : false,
                is_to_call: familyLinkToUse ? familyLinkToUse.is_to_call : false,
                is_accompanying: familyLinkToUse ? familyLinkToUse.is_accompanying : false,
            }
        });

        return <Fragment>
            <div className="application-form" style={{margin: 0}}>
                <div className="row">
                    <div className="d-inline-flex justify-content-between align-items-end w-100 mb-5">
                        <div>
                            <h3 style={{color: "#8AA4B1"}}>Membre concerné</h3>
                        </div>

                        <div className="text-right">
                            <button
                                type="button"
                                className="btn btn-primary text-white font-weight-bold"
                                style={{backgroundColor: "#00334A", borderRadius: "8px"}}
                                onClick={() => this.setState({isModalOpen: true})}
                            >
                                <i className="fa fa-plus mr-2"/> Ajouter un membre
                            </button>
                        </div>
                    </div>
                </div>

                <div className="row mb-3">
                    <div className="alert alert-info d-inline-flex align-items-center pt-4 pb-4"
                         style={{border: "1px solid #0079BF", borderRadius: "12px", color: "#0079BF"}}>
                        <div className="col-1 p-0 text-center">
                            <i className="fas fa-info-circle"></i>
                        </div>
                        <div className="col pl-0 h5">
                            Si le payeur n'est pas renseigné ci-dessous, ajoutez le en tant que
                            membre. Vous
                            pourrez ensuite
                            l'indiquer comme payeur dans l'étape du paiement.
                        </div>
                    </div>
                </div>

                {this.state.showError && this.state.error.members && <div className="row">
                        <p className="text-danger">{this.state.error.members}</p>
                </div>}

                <div className="row mb-4">
                    <ToggleButtonGroup
                        maxSelected={1}
                        childrenContent={members.map((member, i) => renderUserItem(user.id, member, i, selected === i))}
                        selected={[selected]}
                        onChange={selecteds => selecteds.length > 0 ? this.setState({selected: selecteds[0]}) : 0}
                        buttonStyles={{
                            maxWidth: "200px", // max width unset by toggle-button-w-100-sm css class in small screens
                            width: "100%",
                            height: "200px",
                            backgroundColor: "white",
                            padding: "15px",
                            borderRadius: "12px",
                            margin: "0 20px 10px 0",
                            whiteSpace: "nowrap",
                            overflowX: "auto",
                            boxShadow: "none",
                            WebkitBoxShadow: "none",
                            MozBoxShadow: "none",
                        }}
                        buttonClasses={"col-sm-auto toggle-button-w-100-sm"}
                    />
                </div>

                {members.length > 0 && members[selected].id !== user.id && <Fragment>
                    <div className="row">
                        <div className="col-md-6 p-0">

                            <div className="mb-4">
                                <label style={{ color: "#003E5C" }}>Représentant légal <span className="text-danger">*</span></label>
                                <FamilyLinkSelector
                                    familyLinks={virtualFamilyLinks}
                                    isMulti
                                    fieldForSelection="is_legal_referent"
                                    onChange={this.onFamilyLinkSelectorChange}
                                />
                                {this.state.showError && this.state.error.legal_referent && <div className="row">
                                    <p className="text-danger">{this.state.error.legal_referent}</p>
                                </div>}
                            </div>

                            <div className="mb-4">
                                <label style={{color: "#003E5C"}}>Personne à contacter</label>
                                <FamilyLinkSelector
                                    familyLinks={virtualFamilyLinks}
                                    fieldForSelection="is_to_call"
                                    onChange={this.onFamilyLinkSelectorChange}
                                />
                                {this.state.showError && this.state.error.to_call && <div className="row">
                                        <p className="text-danger">{this.state.error.to_call}</p>
                                </div>}
                            </div>

                            <div className="mb-5">
                                <label style={{color: "#003E5C"}}>Accompagnant</label>
                                <FamilyLinkSelector
                                    familyLinks={virtualFamilyLinks}
                                    fieldForSelection="is_accompanying"
                                    onChange={this.onFamilyLinkSelectorChange}
                                />
                                {this.state.showError && this.state.error.accompanying && <div className="row">
                                        <p className="text-danger">{this.state.error.accompanying}</p>
                                </div>}
                            </div>
                        </div>
                    </div>
                </Fragment>}
            </div>


            <Modal
                isOpen={isModalOpen}
                ariaHideApp={false}
                onRequestClose={() => this.setState({isModalOpen: false})}
                style={{
                    content: {
                        top: "5%",
                        left: "25%",
                        right: "25%",
                    },
                }}
            >
                <h2 className="mt-0">Ajouter un membre</h2>
                <h4>création du lien familial du point de vue de {user.first_name} {user.last_name}</h4>
                <ContactForm
                    user_linked={user}
                    current_user={user}
                    initialValues={{}}
                    showFamilyLinkInfos={false}
                    onClose={() => this.setState({isModalOpen: false})}
                    onSubmit={this.onAddMember.bind(this)}
                />
            </Modal>
        </Fragment>;
    }
}

/**
 * @param {number} currentUserId
 * @param {any} user
 * @param {number} i
 * @param {boolean} isSelected
 * @param {function} onClick
 * @returns {JSX.Element}
 */
const renderUserItem = (currentUserId, user, i, isSelected) => <Fragment>
    <div className="d-inline-flex ml-0 mt-0 w-100 justify-content-between">
        <div className="text-left ml-3">
            <UserAvatar user={user} size={75}/>
            <h4 className="font-weight-bold" style={{color: "#00283B"}}>{user.full_name}</h4>
            <p style={{color: "#8AA4B1"}}>{new Date(user.birthday).toLocaleDateString()}</p>
        </div>
        <div>
            <input type="radio" checked={isSelected} readOnly={true} style={{margin: "-5px -5px 0 0"}}/>
        </div>
    </div>
</Fragment>;

const FamilyLinkSelector = ({isMulti, familyLinks, fieldForSelection, onChange}) => {
    const options = familyLinks.map(m => ({
        value: m.id,
        label: `${m.first_name} ${m.last_name}`,
        is_legal_referent: m.is_legal_referent,
        is_to_call: m.is_to_call,
        is_accompanying: m.is_accompanying,
    }));

    return <CreatableSelect
        isMulti={isMulti}
        options={options}
        isClearable={false}
        value={options.filter(fl => fl[fieldForSelection])}
        onChange={eventValues => onChange(eventValues, fieldForSelection)}
        styles={{
            menu: (provided) => ({
                ...provided,
                zIndex: 4,
            }),
            control: (base, state) => ({
                ...base,
                border: "0",
                borderRadius: "8px",
            }),
        }}
    />

};