import React from "react";
import swal from "sweetalert2";
import ReactTable from "react-table";
import { csrfToken } from "./utils";
import {makeDebounce} from "../tools/inputs";
import DetachAccount from "./DetachAccount";
import Modal from "react-modal";

const moment = require("moment");
require("moment/locale/fr");

const requestData = (pageSize, page, sorted, filtered, format) => {

    return fetch(`/users/list${format ? "." + format : ""}`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
            "X-CSRF-Token": csrfToken,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            pageSize,
            page,
            sorted: sorted[0],
            filtered,
        }),
    });
};

const debounce = makeDebounce();

class UserAttach extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            attached_users: [],
            //account_to_attach: undefined,
            data: [],
            pages: null,
            loading: false,
            filter: {},
            selected: [],
            no_data_text: "Chercher des comptes à rattacher",
        };

        this.fetchAttachedUsers = this.fetchAttachedUsers.bind(this)
        this.fetchUsers = this.fetchUsers.bind(this)
        this.selectUserToAttach = this.selectUserToAttach.bind(this)
        this.postAttachUsers = this.postAttachUsers.bind(this)
        this.fetchReferentUser = this.fetchReferentUser.bind(this)
        this.loadAttachedUsers = this.loadAttachedUsers.bind(this)
    }

    async swalShowLoading() {
        swal.fire({
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            onOpen: () => swal.showLoading(),
        });
    }

    async fetchReferentUser(ref_user_id) {
        const res = await fetch("/users/"+ref_user_id+"/infos");
        const data = await res.json();
        return data
    }

    async selectUserToAttach(user) {
        this.swalShowLoading();

        const attached_users = await this.fetchAttachedUsers(user.id)
        
        if (attached_users.length < 1) {
            if (user.attached_to_id) { //si compte déjà rattaché
                const referent_user = await this.fetchReferentUser(user.attached_to_id)
                swal.hideLoading()

                swal.fire({
                    type: 'warning',
                    html:`<h3><b>${user.first_name} ${user.last_name}</b> est déjà rattaché·e à <b>${referent_user.first_name} ${referent_user.last_name}</b><br><br>
                    Souhaitez-vous la·e rattacher à<br><b>${this.props.user.first_name} ${this.props.user.last_name}</b> à la place ?</h3>`,
                    cancelButtonText: 'Annuler',
                    showCancelButton: !swal.isLoading(),
                    showLoaderOnConfirm: true,
                    allowOutsideClick: () => !swal.isLoading(),
                    preConfirm: async () => {await this.postAttachUsers([user]);}
                })
            } else {
                swal.hideLoading()

                swal.fire({
                    type: 'info',
                    html:`<h3>Souhaitez-vous rattacher<br><br><b>${user.first_name} ${user.last_name}</b><br><br>à<br><br><b>${this.props.user.first_name} ${this.props.user.last_name}</b> ?</h3>`,
                    cancelButtonText: 'Annuler',
                    showCancelButton: !swal.isLoading(),
                    showLoaderOnConfirm: true,
                    allowOutsideClick: () => !swal.isLoading(),
                    preConfirm: async () => {await this.postAttachUsers([user]);}
                })
            }
        } else {
            // mise en forme du texte
            let a_users = [];

            for (let u of attached_users) {
                a_users.push(`<br>- <b>${u.first_name} ${u.last_name}</b>`);
            }

            let str_users = a_users.join("?");

            // préparation des données
            attached_users.unshift(user);

            swal.hideLoading();

            swal.fire({
                type: "warning",
                title: "Cet utilisateur·rice a des comptes rattachés",
                html:`<h3>Souhaitez-vous rattacher<br><br><b>${user.first_name} ${user.last_name}</b> ainsi que :<br>${str_users}<br><br>à<br><br><b>${this.props.user.first_name} ${this.props.user.last_name}</b> ?</h3>`,
                cancelButtonText: 'Annuler',
                showCancelButton: !swal.isLoading(),
                showLoaderOnConfirm: true,
                allowOutsideClick: () => !swal.isLoading(),
                preConfirm: async () => {await this.postAttachUsers(attached_users);}
            })
        }
    }

    async postAttachUsers(users_to_attach) {

        const res = await fetch("/users/"+this.props.user.id+"/attach", {
                        method: "PUT",
                        headers: {
                            "X-Csrf-Token": csrfToken,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            users: users_to_attach
                        })
                    })

        if (res.ok) {
            return swal.fire({
                type: "success",
                title: "Compte(s) rattaché(s) avec succès",
            }).then(() => this.loadAttachedUsers());
        } else {
            return swal.fire({
                type: "error",
                title: "Une erreur est survenue lors de l'envoi des données :",
                html: `${res.status}<br>${res.statusText}<br>`
            })
        }

    }

    async fetchAttachedUsers(referent_user_id) {
        const res = await fetch("/users/"+referent_user_id+"/get_attached_users");
        const data = await res.json();
        return data.attached_users
    }

    async loadAttachedUsers() {
        this.swalShowLoading();
        const attached_users = await this.fetchAttachedUsers(this.props.user.id)
        this.setState({attached_users: attached_users});
        swal.close();
    }

    async fetchUsers(state) { // state transmis par reacttable
        this.setState({loading: true, filter: state});

        debounce(() => {
            requestData(
                state.pageSize,
                state.page,
                state.sorted,
                state.filtered
            )
                .then(response => response.json())
                .then(data => {
                    const res = {
                        data: data.users,
                        pages: data.pages,
                        total: data.total,
                    };

                    return res;
                })
                .then(res => {
                    if (state.filtered.length < 1) {
                        this.setState({
                            loading: false,
                            no_data_text: 'Chercher des comptes à rattacher',
                            data: []
                        });
                    } else {
                        this.setState({
                            ...res,
                            loading: false,
                            no_data_text: 'Aucun résultat trouvé',
                        });
                    }
                });
        }, 400);
    }

    componentDidMount() {
        this.loadAttachedUsers()
    }

    render() {
        const events = [];

        const columns = [
            {
                Header: "ID",
                id: "id",
                accessor: d => (
                    <span
                        className="w-100 d-flex text-dark"
                    >
                        {d.id}
                    </span>
                ),
                width: 75,
                sortable: false,
            },
            {
                id: "last_name",
                Header: "Nom",
                sortable: false,
                accessor: d => (
                    <a
                        href={`/users/${d.id}`}
                        className="w-100 d-flex font-underlined"
                    >
                        {d.last_name}
                    </a>
                ),
            },
            {
                id: "first_name",
                Header: "Prénom",
                sortable: false,
                accessor: d => (
                    <a
                        href={`/users/${d.id}`}
                        className="w-100 d-flex font-underlined"
                    >
                        {d.first_name}
                    </a>
                ),
            },
            {
                Header: "Date de naissance",
                id: "birthday",
                accessor: "birthday",
                sortable: false,
                width: 150,
                Cell: props => {
                    if (props.original.birthday) {
                        return (
                            <div
                                className="w-100 d-flex text-dark"
                            >
                                {moment(props.original.birthday).format(
                                    "DD/MM/YYYY"
                                )}
                            </div>
                        );
                    }

                    return <p/>;
                },
                filterable: false,
            },
            {
                width: 200,
                id: "attached",
                Header: "Type de compte",
                sortable: false,
                filterable: false,
                accessor: d => d.attached_to_id ? "Rattaché" : "Principal"
            },
            {
                id: "actions",
                Header: "Actions",
                Cell: props => {
                    let is_user = (props.original.id == this.props.user.id); //Si c'est l'utilisateur de la page actuelle
                    let is_attached_to_user = this.state.attached_users.find(user => user.id == props.original.id); //Si c'est un utilisateur déjà rattaché à celui de la page actuelle
                    return (
                        <div className="btn-wrapper">
                            <div
                                style={{
                                    display: "inline-block",
                                }}
                            >
                            
                            { is_user || is_attached_to_user ?
                                <div>
                                    { is_user ?
                                        <div>Compte actuel</div>
                                    :
                                        <div>Déjà rattaché·e au compte actuel</div>
                                    }
                                </div>
                            :
                                <button
                                    onClick={() => this.selectUserToAttach(props.original)}
                                    className="btn btn-xs btn-primary m-r-sm m-b-sm"
                                >
                                    <i className="fas fa-user-friends"/>&nbsp; Rattacher
                                </button>
                            }
                            </div>
                        </div>
                    );
                },
                sortable: false,
                filterable: false,
            },
        ];

        return (
            <div>
                <div className="ibox">
                    <div className="ibox-title">
                        <h4>Comptes rattachés</h4>
                    </div>
                    <div className="ibox-content no-padding">
                        { this.state.attached_users.length > 0 ?
                            <ul className="list-group">
                                {this.state.attached_users.map(user => (
                                    <li className="list-group-item row" key={user.id}>
                                        <div className="col-lg-4">
                                            <h4>
                                                <a href={"/users/"+user.id}>{user.first_name} {user.last_name}</a>
                                                &nbsp;&nbsp;
                                                <DetachAccount user={user} reload_data={this.loadAttachedUsers}></DetachAccount>
                                            </h4>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        :
                            <div className="p">Cet·te utilisateur·rice n'a pas de comptes rattachés</div>
                        }
                    </div>
                </div>

                <div className="ibox">
                    <div className="ibox-title">
                        <h4>Rattacher des comptes</h4>
                    </div>
                    <div className="row">
                        <div className="col-lg-12">
                            <ReactTable
                                events={events}
                                id="userTable"
                                data={this.state.data}
                                manual
                                pages={this.state.pages}
                                loading={this.state.loading}
                                onFetchData={this.fetchUsers}
                                columns={columns}
                                defaultSorted={[{id: "id", desc: false}]}
                                filterable
                                defaultFilterMethod={(filter, row) => {
                                    if (row[filter.id] != null) {
                                        return row[filter.id]
                                            .toLowerCase()
                                            .startsWith(filter.value.toLowerCase());
                                    }
                                }}
                                resizable={false}
                                previousText="Précédent"
                                nextText="Suivant"
                                loadingText="Chargement..."
                                noDataText={this.state.no_data_text}
                                pageText="Page"
                                ofText="sur"
                                rowsText="résultats"
                                minRows={2}
                            />
                        </div>
                    </div>
                </div>

            </div>
        )

    }
}

export default UserAttach;