import React from "react";
import _ from "lodash";
import Swal from "sweetalert2";
import Modal from "react-modal";

import { modalStyle } from "../../tools/constants";
import * as api from "../../tools/api";
import ContactForm from "./ContactForm";


class HandleFamilyMember extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            isModalOpen: false,
            selectedFamilyMember: -1,
            familyMember: {},
        };
        this.toggleModal = this.toggleModal.bind(this);
    }

    onSubmit = (values, form) => {
        let url = "/users/"+this.props.user.id+"/update_family"
        let user = this.props.user;
        let {familyMember} = this.props
        user.family = [{
            ...values,
            initial_is_inverse: familyMember && familyMember.is_inverse,
        }];
        api.put(url,{
            user: user,
            has_mdp : true,
        }).then(({ data, error })=>{
            let title = ''
            if(error){
                title = '<h5>Une erreur est survenue, <b>'+values.first_name+' '+values.last_name+'</b> n\'a pas été ajouté à la famille de '+this.props.user.first_name+' '+this.props.user.last_name+'.</h5>'
            } else if (this.props.familyMember){
                title += '<h5>Le lien familial entre <b>'+values.first_name+' '+values.last_name+'</b> et <b>'+this.props.user.first_name+' '+this.props.user.last_name+'</b> a été modifié.</h5>';
            } else {
                title += '<h5>L\'utilisateur <b>'+values.first_name+' '+values.last_name+'</b> a été ajouté à la famille de '+this.props.user.first_name+' '+this.props.user.last_name+'.</h5>';
            }

            console.log(error)
            let htmltext = ''
            let confirmtext= 'Fermer'
            Swal.fire({
                title: title,
                html: htmltext,
                // timer: 10000,
                allowOutsideClick: false,
                confirmButtonText: confirmtext,
            }).then(() => {
                this.toggleModal();
                this.setTabToFamilyAndReload();
            })
        })
    }

    setTabToFamilyAndReload()
    {
        if(document.location.search.indexOf("tab=") > -1)
            document.location.replace(document.location.href.replace(/tab=[a-zA-Z]*&+/, "tab=family&"));
        else
            document.location = document.location + "?tab=family";
    }

    onDelete = (values) => {
        let {familyMember, user} = this.props
        let title = "<h5>Voulez-vous supprimer ce lien familial ?</h5>";
        let htmltext = "<p>Le lien familial entre <b>"+ 
            familyMember.first_name +" "+familyMember.last_name+
            "</b> et <b>"+ user.first_name+ " "+ user.last_name+ 
            "</b> sera définitivement supprimé</p>";
        let confirmtext = '<i class="fas fa-trash"></i> Supprimer le lien familial';
        Swal.fire({
            title: title,
            html: htmltext,
            allowOutsideClick: true,
            showCancelButton: true,
            confirmButtonText: confirmtext,
            cancelButtonText:'<i class="fas fa-ban"></i> annuler',
        }).then((res) => {
            if (res.value){
                api.set()
                    .del(`/members/${this.props.familyMember.link_id}`)
                    .then(({data, error}) =>{
                        error ? Swal.fire({
                                title: "Une erreur est survenue",
                                html: "erreur :"+error,
                                confirmButtonText: "fermer",
                            })
                            : this.setTabToFamilyAndReload();
                    })
            }
        })
    }

    onClose = (res) => {
        this.toggleModal();
    }

    toggleModal() {
        this.setState({ isModalOpen: !this.state.isModalOpen });
    }

    render () {
        const {
            isModalOpen,
        } = this.state;
        const {
            user,
            current_user,
            familyMember,
            content_label,
            toggle_title,
            toggle_add_button,
            toggle_edit_buton,
            toggle_delete_button,
        } = this.props
        const formattedInitialValues = familyMember ? {...familyMember}
            : {
                addresses: user.addresses,
                telephones: user.telephones,
                email: user.email,
                is_inverse: true,
            }
        
        let user_fname, user_lname, member_fname, member_lname;
        if (!_.isEmpty(familyMember)){
            [user_fname, user_lname, member_fname, member_lname] = formattedInitialValues.is_inverse ? 
                [user.first_name, user.last_name, familyMember.first_name, familyMember.last_name]
                : [familyMember.first_name, familyMember.last_name, user.first_name, user.last_name]
        }
        return (
            <div className="col pl-3">
                {toggle_add_button && <a className="btn btn-success" onClick={this.toggleModal} title={"Ajouter un membre à la famille"}>
                    <i className="fas fa-plus"/>{toggle_title && " Ajouter un nouveau membre"}
                </a>
                }
                {toggle_edit_buton && <a className="btn btn-primary m-0" onClick={this.toggleModal} title={"Edition du lien familial"}>
                    <i className="fas fa-pen"/>{toggle_title && " Éditer"}
                </a>
                }
                {toggle_delete_button && 
                    <a className="btn btn-warning" onClick={this.onDelete} title={"Suppression du lien familial"}><i className="fas fa-trash"/></a>
                }
                <Modal
                    isOpen={isModalOpen}
                    ariaHideApp={false}
                    onRequestClose={this.toggleModal}
                    style={{
                        content: {
                          top: '5%',
                          left: '25%',
                          right: '25%',
                        },
                      }}
                >
                    <h2 className="mt-0">{content_label}</h2>
                    {!_.isEmpty(familyMember) ? <h4>Lien de {user_fname} {user_lname} envers {member_fname} {member_lname}</h4>
                        : <h4>création du lien familial du point de vue de {user.first_name} {user.last_name}</h4>}
                    <ContactForm
                        user_linked={user}
                        current_user={current_user}
                        initialValues={formattedInitialValues}
                        onClose={(res) => this.onClose(res)}
                        onSubmit={this.onSubmit}
                    />
                </Modal>
            </div>
        )
    }
}

export default HandleFamilyMember;