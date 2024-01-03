import React, {useState} from "react";
import * as api from "../../tools/api";
import {Field} from "react-final-form";
import {fullnameWithAge} from "../../tools/format";
import {isEmpty, required} from "../../tools/validators";
import Input from "../common/Input";

export default function BandUser({season, currentMembers, onClose, onSubmit}) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [suggestions, setSuggestions] = useState(null);

    function handleNameChange({target: {name, value}}) {
        switch (name) {
            case "first_name":
                setFirstName(value);
                break;
            case "last_name":
                setLastName(value);
                break;
            case "email":
                setEmail(value);
                break;
        }
    }

    const canSearch = Math.min(firstName.length, lastName.length) > 2;
    const noSuggestions = suggestions && suggestions.length === 0;

    function searchUser() {
        api.post("/users/search_for_admin", {
            first_name: firstName,
            last_name: lastName,
            season_id: season.id,
        })
            .then(({data}) => {
                if (currentMembers) {
                    setSuggestions(data.filter(x => !currentMembers.some(current => current.id === x.id)))
                } else {
                    setSuggestions(data)
                }

            });
    }

    function confirmNewUser(e) {
        e.preventDefault();

        if (firstName !== undefined && firstName !== "" && lastName !== undefined && lastName !== "" ) {
            onSubmit({
                id: 0,
                first_name: firstName,
                last_name: lastName,
                email: email
            });
            onClose();

            e.stopPropagation();
        } else {

        }

    }

    function confirmExistingUser(u) {
        onSubmit({
            id: u.id,
            first_name: u.first_name,
            last_name: u.last_name,
            email: email
        });
        onClose();
    }

    return <article className="card card-light m-b">
        <div className="flex flex-space-between-justified">
            <h4>Nouveau membre</h4>
            <i className="fa fa-times" style={{cursor: "pointer"}} onClick={onClose}/>
        </div>
        <form onSubmit={confirmNewUser} >
                <div className="flex">
                    <div className="form-group w-100">
                        <label>Prénom <span className="text-danger">{" *"}</span></label>
                        <input
                            type="text"
                            name="first_name"
                            required
                            onChange={handleNameChange}
                            className="form-control"
                            style={{borderRadius: "5px 0 0 5px"}}
                            value={firstName}/>

                    </div>
                    <div className="form-group w-100">
                        <label>Nom <span className="text-danger">{" *"}</span></label>
                        <input
                            type="text"
                            name="last_name"
                            required
                            onChange={handleNameChange}
                            className="form-control"
                            style={{borderRadius: "0 5px 5px 0"}}
                            value={lastName}/>
                    </div>
                </div>
                <div className="flex">
                    <div className="form-group w-100">
                        <label>E-mail</label>
                        <input
                            type="email"
                            name="email"
                            style={{borderRadius: "5px"}}
                            className="form-control"
                            placeholder="(optionnel)"
                            value={email}
                            onChange={handleNameChange}
                        />
                    </div>
                </div>
            <section className="flex flex-space-between-justified m-b">
                <button type="button" className="btn btn-xs btn-primary" disabled={!canSearch} onClick={searchUser}>
                    <i className="fa fa-search m-r-sm"/>Rechercher
                </button>
                <button
                    type="submit"
                    className="btn btn-xs btn-primary">
                    <i className="fa fa-plus m-r-sm"/>Créer un nouveau
                </button>
            </section>
        </form>
        {suggestions && suggestions.length > 0 &&
        <section className="list-group">
            {suggestions.map((u) => <div key={u.id} className="list-group-item flex flex-space-between-justified">
                <span>{fullnameWithAge(u)}</span>
                <button type="button" onClick={confirmExistingUser.bind(this, u)}
                        className="btn btn-xs btn-primary">Sélectionner
                </button>
            </div>)}
        </section>}
        {noSuggestions &&
        <h5 className="flex flex-center-aligned"><i className="fa fa-2x fa-times m-r"/> Pas d'utilisateur trouvé</h5>}
    </article>;
}