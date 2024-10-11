import React from "react";
import _ from "lodash";
import * as api from "../../../tools/api";
import UserSearch from "./UserSearch";
import swal from "sweetalert2"

export default class MergeUsers extends React.Component
{
    CheckBoxType = ({id, name, value}) =>
    {
        return <div><input type="checkbox" id={id} onClick={({target}) => this.setState({selectedDataToSave: Math.max(this.state.selectedDataToSave, 0) +  value * (target["checked"] ? 1 : -1) })}/> <label htmlFor={id}>{name}</label></div>
    }

    constructor(props)
    {
        super(props);

        this.state = {
            olUser: undefined,
            newUser: undefined,
            deleteOldUser: false,
            selectedDataToSave: -1
        }
    }

    render()
    {
        return <div className="wrapper">
            {/*C'est horrible mais il n'est pas possible d'utiliser l'import css classique de réact...
            L'objet reste toujours vide.*/}
            <style>
                {".onoffswitch-inner:before {\n" +
                    "    content: \"Supprimer l'ancien utilisateur (rouge)\";\n" +
                    "    padding-left: 10px;\n" +
                    "    background-color: #1AB394;\n" +
                    "    color: #FFFFFF;\n" +
                    "}\n" +
                    "\n" +
                    ".onoffswitch-inner:after {\n" +
                    "    content: \"Garder l'ancien utilisateur (rouge)\";\n" +
                    "    padding-right: 10px;\n" +
                    "    background-color: #FFFFFF;\n" +
                    "    color: #999999;\n" +
                    "    text-align: right;\n" +
                    "}\n" +
                    "\n" +
                    ".onoffswitch-switch {\n" +
                    "    display: block;\n" +
                    "    width: 18px;\n" +
                    "    margin: 0;\n" +
                    "    background: #FFFFFF;\n" +
                    "    border: 2px solid #1AB394;\n" +
                    "    border-radius: 3px;\n" +
                    "    position: absolute;\n" +
                    "    top: 0;\n" +
                    "    bottom: 0;\n" +
                    "    right: 192px;\n" +
                    "    transition: all 0.3s ease-in 0s;\n" +
                    "}"}
            </style>
            <div className="row">
                <div className="col">
                    <UserSearch saveFirstSelect={true} onSelect={this.handleSelectUser.bind(this)} resetSelection={this.handleReset.bind(this)} season={this.props.season} />
                </div>
            </div>

            {this.state.newUser !== undefined ? <div>
                <div className="row">
                    <div className="onoffswitch" style={{width: '210px'}}>
                        <input className="onoffswitch-checkbox" id="delete?" type="checkbox" value="test" onChange={() => this.setState({deleteOldUser: !this.state.deleteOldUser})}/>
                        <label className="onoffswitch-label" htmlFor='delete?'>
                            <span className="onoffswitch-inner"/>
                            <span className="onoffswitch-switch"/>
                        </label>
                    </div>
                </div>

                <div className="row">
                    <div><input type="radio" id="saveNewData" name="dataSaved" checked={this.state.selectedDataToSave === -1} onChange={() => this.setState({selectedDataToSave: -1})} /> <label htmlFor="saveNewData">Garder toutes les donnée de base<sup>*</sup> du nouvel utilisateur (bleu)</label></div>
                    <div><input type="radio" id="saveOldData" name="dataSaved" checked={this.state.selectedDataToSave === -2} onChange={() => this.setState({selectedDataToSave: -2})}/> <label htmlFor="saveOldData">Garder toutes les donnée de base<sup>*</sup> de l'ancien utilisateur (rouge)</label></div>
                    <div>
                        <input type="radio" id="othersData" name="dataSaved" checked={this.state.selectedDataToSave === -3 || this.state.selectedDataToSave >= 0} onChange={() => this.setState({selectedDataToSave: -3})}/> <label htmlFor="othersData">Sélectionner les données de base<sup>*</sup> de l'ancien utilisateur à garder. </label>
                        {this.state.selectedDataToSave === -3 || this.state.selectedDataToSave >= 0 ? <div className="m-l-xl">
                            {this.CheckBoxType({id: "first_name", name: "Prénom", value: 1})}
                            {this.CheckBoxType({id: "last_name", name: "Nom", value: 2})}
                            {this.CheckBoxType({id: "email", name: "E-Mail", value: 4})}
                            {this.CheckBoxType({id: "birthday", name: "Date de naissance", value: 8})}
                            {this.CheckBoxType({id: "address", name: "Adresse", value: 16})}
                            {this.CheckBoxType({id: "is_teacher", name: "Rôle du professeur", value: 32})}

                        </div> : ""}
                    </div>

                </div>

                <div className="row">
                    <p><sup>*</sup>  de base = Toutes les données contenues directement dans un utilisateur (nom, prénom, email, adresse, date de naissance).<br/>Peu importe le choix effectué, les données liées seront transférées (liens familiaux, paiements, cours, etc...)</p>
                </div>

                <div className="row">
                    <button type="button" className="btn btn-primary" onClick={this.handleFusion.bind(this)}>Valider</button>
                </div>
            </div> : "" }
        </div>
    }

    handleReset()
    {
        this.setState({oldUser: undefined, newUser: undefined})
    }

    handleSelectUser(user)
    {
        const userState = {
            oldUser: this.state.oldUser,
            newUser: this.state.newUser,
            selectedDataToSave: -1,
            deleteOldUser: false
        }

        if(userState.oldUser === undefined)
            userState.oldUser = user;
        else
            userState.newUser = user.id !== userState.oldUser.id ? user : undefined;

        this.setState(userState);
    }

    handleFusion()
    {
        const oldU = this.state.oldUser;
        const newU = this.state.newUser;

        if(oldU === undefined || newU === undefined) return;

        swal({
            title: "Fusionner les deux utilisateurs séléctionnés ?",
            text: this.state.deleteOldUser ? "L'utilisateur en rouge seras supprimé." : undefined,
            type: "question",
            confirmButtonText: "oui",
            showCancelButton: true,
            cancelButtonText: "non"
        }).then(willMerge =>
        {
            if(willMerge.value)
            {
                api.set().success(() =>
                {
                    swal({
                        title: "Fusion effectué",
                        type: "success",
                        confirmButtonText: "Ok"
                    }).then(res =>
                    {
                        if(this.state.deleteOldUser)
                            window.location.reload();
                    });
                })
                    .error(() =>
                    {
                        swal({
                            title: "Une erreur est survenue.",
                            type: "error",
                            confirmButtonText: "Ok"
                        });
                    })
                    .post("/scripts/merge_users/execute",
                        {
                            old_user_id: oldU.id,
                            saved_user_id: newU.id,
                            delete: this.state.deleteOldUser,
                            dataToSave: this.state.selectedDataToSave
                        })
            }
        })
    }
}