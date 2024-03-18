import React, { Fragment, useEffect, useState } from "react";
import UserSearch from "./scripts/mergeUsers/UserSearch";
import * as api from "../tools/api";
import _, { uniqBy } from "lodash";
import swal from "sweetalert2";

const UserListItem = ({user, onEmailChange, onRemove}) => <div
    className={"list-group-item row d-flex h-100"}
>
    <div className="col-sm-5 my-auto">
        <b>{user.first_name} {user.last_name}</b>({user.id}), Adhérent #${user.adherent_number}
    </div>

    <div className="col-sm-6">
        email (peut être vide) :
        <input
            type="text"
            className="form-control"
            placeholder="email"
            value={user.email}
            onChange={e => onEmailChange(user.id, e.target.value)}
        />
    </div>

    <div className="col-sm-1 text-right my-auto">
        <i className="fas fa-times pointer-event"
           onClick={() => onRemove(user.id)} />
    </div>
</div>

export default function AttachAccount({ onSuccess }) {
    const [season, setSeason] = useState(null)
    const [parentAccount, setParentAccount] = useState(null)
    const [accountToAttach, setAccountToAttach] = useState([])

    useEffect(() => {
        api.set()
            .success(seasons => {
                setSeason(seasons.find(season => season.current) || seasons[0])
            })
            .error(() => setSeason(null))
            .get("/seasons");
    }, []);

    if (parentAccount == null) {
        return <Fragment>
            <h3>Sélectionner le compte de rattachement auquel associer des utilisateurs</h3>
            <UserSearch
                saveFirstSelect={true}
                onSelect={user => setParentAccount(user)}
                resetSelection={() => setParentAccount(null)}
                season={season}
                hideAttachedAccounts={true}
            />
        </Fragment>
    }

    function onValidate()
    {
        swal({
            type: "warning",
            title: "Êtes-vous sûr ?",
            text: "Voulez-vous vraiment attacher ces utilisateurs au compte de rattachement ? Cela va supprimer le mot de passe des comptes rattachés. Ces derniers ne pourront donc plus se connecter.",
            showCancelButton: true,
            confirmButtonText: "Oui",
            cancelButtonText: "Non"
        }).then((result) => {
            if (result.value) {
                api.set()
                    .success(() => {
                        swal({
                            type: "success",
                            title: "Comptes attachés",
                            text: "Les comptes ont bien été attaché"
                        }).then(() => {
                            if (onSuccess && typeof onSuccess === "function") {
                                onSuccess()
                            }

                            setAccountToAttach([])
                            setParentAccount(null)
                        })
                    })
                    .error(() => {
                        swal({
                            type: "error",
                            title: "Erreur",
                            text: "Une erreur est survenue lors de l'attachement des comptes"
                        })
                    })
                    .put(`/users/${parentAccount.id}/attach`, {
                        users: accountToAttach
                    })
            }
        });
    }

    return <Fragment>
        <h3>Associer des utilisateurs au compte de rattachement
            ({`${parentAccount.first_name} ${parentAccount.last_name}`})</h3>

        {accountToAttach.length > 0 && <Fragment>
            <hr />

            <h3>Utilisateurs sélectionnés</h3>

            <div className="list-group">
                {_.map(accountToAttach, (m, i) => <UserListItem
                    key={i}
                    user={m}
                    onEmailChange={(_, email) => setAccountToAttach(_.uniqBy([...accountToAttach.filter(u => u.id != m.id), {
                        id: m.id,
                        first_name: m.first_name,
                        last_name: m.last_name,
                        adherent_number: m.adherent_number,
                        email: email
                    }], u => u.id))}

                    onRemove={_ => setAccountToAttach(accountToAttach.filter(u => u.id != m.id))}
                />)}
            </div>

        </Fragment>}

        <hr />

        <UserSearch
            saveFirstSelect={false}
            onSelect={user => setAccountToAttach(_.uniqBy([...accountToAttach, {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                adherent_number: user.adherent_number,
                email: user.email
            }], u => u.id))}
            resetSelection={() => setAccountToAttach([])}
            season={season}
            hideAttachedAccounts={true}
        />

        <hr />

        <div className="row">
            <div className="col text-right">
                <button
                    type="button"
                    className="btn btn-success"
                    onClick={onValidate}
                >
                    Attacher les comptes
                </button>
            </div>
        </div>
    </Fragment>
}