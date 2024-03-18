import React from "react";
import _ from "lodash";

const moment = require("moment");
require("moment/locale/fr");

import { csrfToken } from "./utils";
import { makeDebounce } from "../tools/inputs";
import ReactTableFullScreen from "./ReactTableFullScreen";
import * as api from "../tools/api";
import swal from "sweetalert2";
import {post} from "../tools/api";
import Modal from "react-modal";
import AttachAccount from "./AttachAccount";

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

const isActive = adhesion => {
    const now = moment();
    return (
        moment(adhesion.validity_start_date) < now &&
        moment(adhesion.validity_end_date) > now &&
        adhesion.is_active
    );
};

const anyActive = adhesions => {
    return _.chain(adhesions)
        .filter(adhesion => isActive(adhesion))
        .some()
        .value();
};

const hasActivity = d => {
    return d.activities.length > 0;
};

const debounce = makeDebounce();

class UserList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            data: [],
            pages: null,
            loading: true,
            filter: {},
            selected: []
        };

        this.fetchData = this.fetchData.bind(this);
        this.downloadFile = this.downloadFile.bind(this);
        this.returnBlob = this.returnBlob.bind(this);
        this.sendConfirmationMail = this.sendConfirmationMail.bind(this);
    }

    fetchData(state, instance) {
        this.setState({ loading: true, filter: state });

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
                    this.setState({
                        ...res,
                        loading: false,
                    });
                });
        }, 400);
    }

    returnBlob(res) {
        if (res.headers.has("content-disposition")) {

            const content = res.headers.get("content-disposition");
            const match = content.match(/filename=\"(.*)\"/);
            if (match) {
                this.filename = match[1]
            }
        }
        return res.blob();
    }

    downloadFile(file) {
        const download = document.createElement("a");
        download.download = this.filename || `${moment().format(
            "DD_MM_YYYY-HH_mm_ss"
        )}.csv`;
        download.href = URL.createObjectURL(file);
        document.body.appendChild(download);
        download.click();
        document.body.removeChild(download);
    }

    onCsvExport() {
        swal({
            type: "info",
            title: "Génération du fichier CSV",
            text: "Veuillez patienter...",
            allowEscapeKey: false,
            allowOutsideClick: false
        });
        swal.showLoading();

        requestData(
            this.state.filter.pageSize,
            this.state.filter.page,
            this.state.filter.sorted,
            this.state.filter.filtered,
            "csv"
        )
            .then(res => this.returnBlob(res))
            .then(file => {
                this.downloadFile(file);
                swal.close();
            })
            .catch(err => {
                console.error(err);
                swal({
                    type: "error",
                    title: "Une erreur est survenue",
                    text: "Veuillez réessayer plus tard",
                    confirmButtonText: "Ok"
                });
            });
    }

    sendConfirmationMail()
    {
        api.set()
            .success((datas) => {
                if(!datas || datas.length === 0)
                {
                    swal({
                        title: `Tous les utilisateurs ${this.state.selected.length > 0 ? "sélectionnés" : ""} ont déjà confirmé leur compte`,
                        type: "warning",
                        confirmButtonText: "Ok"
                    });
                }
                else
                {
                    swal({
                        title: `Les utilisateurs suivants ont reçu un mail de confirmation :`,
                        html: "<ul>" + datas.map(d => `<li>${d}</li>`).join("") + "</ul>",
                        type: "success",
                        confirmButtonText: "Ok"
                    });
                }
            })
            .error((error) => {
                swal({
                    title: `Une erreur est survenue`,
                    type: "error",
                    confirmButtonText: "Ok"
                });
            })
            .post('/users/resend_confirmation', {ids: this.state.selected.length > 0 ? this.state.selected : this.state.data.map(d => d.id)});
    }

    render() {
        const { data, pages, loading } = this.state;

        const columns = [
            {
                Header: "",
                id: "selection",
                width: 25,
                sortable: false,
                accessor: d => this.state.selected.includes(d.id),
                Filter: () => <input
                    type="checkbox"
                    checked={
                        this.state.selected === "all" ||
                        this.state.selected.length === data.length
                    }
                    onChange={e =>
                        e.target.checked
                            ? this.setState({
                                selected: data.map(r => r.id),
                            })
                            : this.setState({selected: []})
                    }
                />,
                Cell: d => <input
                    type="checkbox"
                    checked={this.state.selected === "all" || d.value}
                    onChange={e =>
                        this.setState({
                            selected: e.target.checked ? [...this.state.selected, d.original.id] : this.state.selected.filter(id => id !== d.original.id),
                        })
                    }
                />,
            },
            {
                Header: "#",
                id: "adherent_number",
                accessor: d => (
                    <a
                        href={`/users/${d.id}`}
                        className="w-100 d-flex text-dark"
                    >
                        {d.adherent_number}
                    </a>
                ),
                width: 75,
            },
            {
                Header: "Rôle",
                id: "role",
                width: 200,
                accessor: d => {
                    if (d.is_admin) {
                        return (
                            <a
                                href={`/users/${d.id}`}
                                className="badge badge-success"
                            >
                                Administrateur
                            </a>
                        );
                    } else if (d.is_teacher) {
                        return (
                            <a
                                href={`/users/${d.id}`}
                                className="badge badge-warning"
                            >
                                Professeur
                            </a>
                        );
                    } else if (hasActivity(d)) {
                        return (
                            <a
                                href={`/users/${d.id}`}
                                className="badge badge-warning"
                            >
                                Élève
                            </a>
                        );
                    } else if (anyActive(d.adhesions)) {
                        return (
                            <a
                                href={`/users/${d.id}`}
                                className="badge badge-warning"
                            >
                                Adhérent
                            </a>
                        );
                    } else if (d.attached_to_id) {
                        return (
                            <a
                                href={`/users/${d.id}`}
                                className="badge"
                                style={{ backgroundColor: "#009f9a", color: "white" }}
                            >
                                Utilisateur rattaché
                            </a>
                        );
                    } else {
                        return (
                            <a
                                href={`/users/${d.id}`}
                                className="badge badge-primary"
                            >
                                Utilisateur
                            </a>
                        );
                    }
                },
                sortable: false,
                filterable: !this.props.nofilter,
                Filter: ({ filter, onChange }) => (
                    <select
                        onChange={event => onChange(event.target.value)}
                        style={{ width: "100%" }}
                        value={filter ? filter.value : "all"}
                    >
                        <option value="all">Tous les utilisateurs</option>
                        <option value="adherent">Adhérents</option>
                        <option value="admin">Administrateurs</option>
                        <option value="user">Autres</option>
                        <option value="student">Élèves</option>
                        <option value="teacher">Professeurs</option>
                        <option value="attached">Utilisateur rattachés</option>
                    </select>
                ),
            },
            {
                id: "last_name",
                Header: "Nom",
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
                Cell: props => {
                    if (props.original.birthday) {
                        return (
                            <a
                                href={`/users/${props.original.id}`}
                                className="w-100 d-flex text-dark"
                            >
                                {moment(props.original.birthday).format(
                                    "DD/MM/YYYY"
                                )}
                            </a>
                        );
                    }

                    return <p />;
                },
                filterable: false,
            },
            {
                id: "actions",
                Header: "Actions",
                Cell: props => {
                    return (
                        <div className="btn-wrapper">
                            <div
                                className=" m-r"
                                style={{
                                    width: "85px",
                                    display: "inline-block",
                                }}
                            >
                                {props.original.planning ? (
                                    <a
                                        href={`/planning/${props.original.planning.id}`}
                                        className="btn btn-xs btn-primary m-b-sm"
                                    >
                                        <i className="fas fa-calendar" />
                                        &nbsp; Planning
                                    </a>
                                ) : null}
                            </div>

                            <div
                                style={{
                                    width: "85px",
                                    display: "inline-block",
                                }}
                            >
                                {
                                    anyActive(props.original.adhesions)
                                    || props.original['any_users_self_is_paying_for?'] ? (
                                    <a
                                        href={`/payments/summary/${props.original.id}`}
                                        className="btn btn-xs btn-primary m-r-sm m-b-sm"
                                    >
                                        <i className="fas fa-euro-sign" />
                                        &nbsp; Paiements
                                    </a>
                                ) : (
                                    ""
                                )}
                            </div>
                        </div>
                    );
                },
                sortable: false,
                filterable: false,
            },
        ];

        const events = [];

        return (
            <div>
                <div className="m-md">
                    <button
                        className="btn btn-primary m-r"
                        onClick={() => this.onCsvExport()}
                    >
                        <i className="fas fa-upload m-r-sm" />
                        Exporter en CSV
                    </button>

                    <a className="btn btn-primary m-r" href="/scripts/merge_users">
                        Fusionner des doublons
                    </a>

                    <button className="btn btn-primary m-r" href="/users/new" onClick={() => this.setState({showAttachAccountModal: true})}>
                        <i className="fas fa-bezier-curve"></i>&nbsp;
                        Rattacher des utilisateurs
                    </button>


                    <button
                        data-tippy-content="Envoyer le mail de confirmation"
                    className="btn btn-warning" onClick={this.sendConfirmationMail}>
                        <i className="fas fa-envelope" />
                    </button>
                </div>

                <ReactTableFullScreen
                    events={events}
                    id="userTable"
                    data={data}
                    manual
                    pages={pages}
                    loading={loading}
                    onFetchData={this.fetchData}
                    columns={columns}
                    defaultSorted={[{ id: "adherent_number", desc: true }]}
                    filterable
                    defaultFiltered={[{ id: "role", value: this.props.filter }]}
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
                    noDataText="Aucune donnée"
                    pageText="Page"
                    ofText="sur"
                    rowsText="résultats"
                    minRows={1}
                />

                <div className="flex flex-center-justified m-t-xs">
                    <h3>{`${this.state.total} utilisateurs au total`}</h3>
                </div>

                <Modal
                    isOpen={this.state.showAttachAccountModal}
                    ariaHideApp={false}
                    onRequestClose={() => this.setState({showAttachAccountModal: false})}
                    className="modal-lg">
                    <AttachAccount onSucess={() => {
                        this.setState({showAttachAccountModal: false});
                        this.fetchData(this.state.filter)
                    }} />
                </Modal>
            </div>
        );
    }
}

export default UserList;
