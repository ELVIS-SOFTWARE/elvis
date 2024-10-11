import React from "react";
import _ from "lodash";
import swal from "sweetalert2";

const moment = require("moment");
require("moment/locale/fr");

import ReactTable from "react-table";
import Select from "react-select";
import MessageModal from "./MessageModal";
import { csrfToken } from "../utils";

const NB_DISPLAYED_RECIPIENTS = 3;
const MESSAGE_MODAL_ID = "messagesModal";

const requestData = (pageSize, page, sorted, filtered) => {
    return fetch(`/users/payment_schedules`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
            "X-CSRF-Token": csrfToken,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            pageSize,
            page,
            sorted: sorted[0],
            filtered,
        }),
    })
        .catch(reason => alert(reason))
        .then(response => response.json())
        .then(data => ({
            data: data.users,
            pages: data.pages,
            total: data.total,
        }));
};

class DuePaymentList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            data: [],
            targets: [],
            filter: {
                filtered: [],
                sorted: [],
            },
            message: {
                title: "Rappel pour paiement",
                content: "",
                isEmail: true,
                isSMS: false,
            },
            pages: null,
            page: 0,
            loading: true,
            total: 0,
        };
    }

    componentDidMount() {
        this.mounted = true;
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    fetchData(filter) {
        this.setState({ loading: true, filter, targets: [] });

        requestData(
            filter.pageSize,
            filter.page,
            filter.sorted,
            filter.filtered
        ).then(res => {
            if (!this.mounted) return;
            this.setState({
                ...res,
                loading: false,
            });
        });
    }

    sendReminderMail() {
        swal({
            title: "Confirmation d'envoi",
            text: "Êtes-vous sûr ?",
            type: "question",
            showCancelButton: true,
        })
            .then(v => {
                if (v.value) {
                    return fetch("/messages/create", {
                        method: "POST",

                        headers: {
                            "X-Csrf-Token": csrfToken,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            message: this.state.message,
                            to: this.state.targets,
                        }),
                    });
                }
            })
            .then(res => {
                if (res) {
                    if (res.ok)
                        swal({
                            title: "Succès",
                            text: "Message envoyé",
                            type: "success",
                        });
                    else
                        throw new Error(
                            `Erreur ${res.status} : ${res.statusText}`
                        );
                }
            })
            .catch(reason =>
                swal({
                    title: "Erreur",
                    text: reason,
                    type: "error",
                })
            );
    }

    updateTarget(id, checked) {
        if (checked) {
            //add target to bulk targets list
            this.setState({
                targets: [...this.state.targets, id],
            });
        } else {
            if (this.state.targets === "all")
                this.setState({
                    targets: this.state.data
                        .map(d => d.id)
                        .filter(d => d !== id),
                });
            else
                this.setState({
                    targets: this.state.targets.filter(r => r !== id),
                });
        }
    }

    //Goto ActivitiesApplicationsList#bulkAlert
    targetsAlert() {
        const count =
            (this.state.targets === "all" && this.state.total) ||
            this.state.targets.length;

        return (
            <div
                className="alert alert-info m-t-sm"
                style={{ marginBottom: "0", width: "100%" }}
            >
                <div className="flex flex-space-between-justified flex-center-aligned">
                    <div id="targets-infos">
                        Vous avez sélectionné {count} payeur(s){" "}
                        {this.state.targets.length === this.state.data.length &&
                        Math.max(
                            this.state.total - this.state.targets.length,
                            0
                        ) ? (
                            <button
                                onClick={() =>
                                    this.setState({ targets: "all" })
                                }
                                className="btn btn-sm btn-info m-l-sm"
                            >
                                Sélectionner les{" "}
                                {this.state.total - this.state.targets.length}{" "}
                                restants
                            </button>
                        ) : null}
                    </div>
                    <div id="targets-actions">
                        <button
                            className="btn btn-sm btn-primary"
                            disabled={this.state.targets === "all"}
                            data-toggle="modal"
                            data-target={`#${MESSAGE_MODAL_ID}`}
                        >
                            Envoyer un message
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    render() {
        const seasonsOptions = _.sortBy(this.props.seasons, s => s.label).map(
            s => (
                <option key={s.id} value={s.id}>
                    {s.label}
                </option>
            )
        );

        //Tries to take the season from the table query
        const season = _.find(
            _.get(this.state, "filter.filtered"),
            ({ id }) => id === "season"
        );

        //If a season filter is taken, compare against it.
        //Otherwise compare against all seasons.
        const seasonsToCheck = season
            ? [parseInt(season.value)]
            : this.props.seasons.map(s => s.id);

        //This map takes all users and for each of them
        //determines their "validity", which is if they have the desired
        //schedules, of only some of them, or not at all.
        //The meaning is different whether there is a season filter or not:
        //- A season is selected:  are not valid users which do not have
        //a schedule for the selected season
        //- No season selected: Are not valid users without schedules,
        //partially valid those with schedules for only some of the seasons
        //and are valid users which have a schedule for each season
        const validityMap = _.reduce(
            this.state.data,
            (acc, { id, payment_schedules }) => {
                //User is invalid by default, the checkings done below
                //are looking for proofs of his innocence :)
                let result = "N";

                const schedulesSeasons = payment_schedules.map(
                    s => s.season_id
                );

                //Checks if there is a schedule for each season to check
                const seasonsCheck = _.reduce(
                    seasonsToCheck,
                    (acc, id) => acc && schedulesSeasons.includes(id),
                    true
                );

                if (seasonsCheck) {
                    //The payer has a schedule for every season selected
                    result = "E";
                } else if (!season && schedulesSeasons.length) {
                    //The payer has a schedule for only some of the seasons selected
                    result = "NE";
                }

                //Aggregates previous results with the current one.
                //This map associates users (with their ids) to their validity
                return {
                    ...acc,
                    [id]: result,
                };
            },
            {}
        );

        const columns = [
            {
                Header: "",
                id: "selection",
                width: 25,
                sortable: false,
                accessor: r => this.state.targets.includes(r.id),
                Filter: () => (
                    <input
                        type="checkbox"
                        checked={
                            this.state.targets === "all" ||
                            this.state.targets.length === this.state.data.length
                        }
                        onChange={e =>
                            e.target.checked
                                ? this.setState({
                                      targets: this.state.data.map(r => r.id),
                                  })
                                : this.setState({ targets: [] })
                        }
                    />
                ),
                Cell: d => (
                    <input
                        type="checkbox"
                        checked={this.state.targets === "all" || d.value}
                        onChange={e =>
                            this.updateTarget(d.original.id, e.target.checked)
                        }
                    />
                ),
            },
            {
                Header: "Nom",
                id: "name",
                accessor: d => `${d.first_name} ${d.last_name}`,
                Cell: c => (
                    <a
                        href={`/users/${c.original.id}`}
                        style={{ fontSize: "1.2em" }}
                    >
                        {c.value}
                    </a>
                ),
            },
            {
                Header: "Actions",
                maxWidth: 200,
                filterable: false,
                sortable: false,
                id: "actions",
                accessor: u => ({
                    userId: u.id,
                    mail: validityMap[u.id] !== "E",
                }),
                Cell: d => (
                    <div className="flex">
                        {d.value.mail ? (
                            <button
                                style={{ fontSize: "1.2em" }}
                                onClick={() =>
                                    this.setState({ targets: [d.original.id] })
                                }
                                className="btn btn-xs btn-primary"
                                title="Envoyer un rappel"
                                data-toggle="modal"
                                data-target={`#${MESSAGE_MODAL_ID}`}
                            >
                                <i className="fas fa-envelope" />
                            </button>
                        ) : null}
                    </div>
                ),
            },
        ];

        const currentSeason = this.props.seasons.find(s => s.is_current);
        const seasonFilterId = _.chain(this.state.filter)
            .get("filtered")
            .find(({ id }) => id === "season")
            .get("value")
            .value();

        const filteredSeason =
            seasonFilterId &&
            _.find(this.props.seasons, s => s.id == seasonFilterId);

        let recipientsToDisplay = [];

        if (this.state.targets === "all")
            recipientsToDisplay = this.state.data.slice(
                0,
                NB_DISPLAYED_RECIPIENTS
            );
        else if (this.state.targets.length)
            recipientsToDisplay =
                this.state.targets.length &&
                this.state.data.filter(d =>
                    this.state.targets
                        .slice(0, NB_DISPLAYED_RECIPIENTS)
                        .includes(d.id)
                );

        let recipients = recipientsToDisplay
            .map(u => `${u.first_name} ${u.last_name}`)
            .join(", ");

        const restCount = Math.max(
            0,
            this.state.targets === "all"
                ? this.state.total - NB_DISPLAYED_RECIPIENTS
                : this.state.targets.length - NB_DISPLAYED_RECIPIENTS
        );
        if (restCount) recipients += `, et ${restCount} autres`;

        return (
            <div>
                <div className="flex">
                    <h2>
                        {this.state.total} payeurs sans échéancier pour
                        <select className="transparentSelector"
                            onChange={e => {
                                const newFilter = {
                                    ...this.state.filter,
                                    filtered: [...this.state.filter.filtered],
                                };
                                const seasonFilterIndex = _.findIndex(
                                    newFilter.filtered,
                                    { id: "season" }
                                );
                                newFilter.filtered.splice(
                                    (seasonFilterIndex !== -1 &&
                                        seasonFilterIndex) ||
                                        0,
                                    (seasonFilterIndex !== -1 && 1) || 0,
                                    { id: "season", value: e.target.value }
                                );

                                this.fetchData(newFilter);
                            }}
                            value={(filteredSeason && filteredSeason.id) || 0}
                        >
                            {seasonsOptions}
                        </select>
                    </h2>
                </div>
                {this.state.targets.length ? this.targetsAlert() : null}
                <div className="ibox-content no-padding">
                    <ReactTable
                        data={this.state.data}
                        manual
                        pages={this.state.pages}
                        loading={this.state.loading}
                        onFetchData={filter => this.fetchData(filter)}
                        columns={columns}
                        pageSizeOptions={[10, 14, 20, 30, 50]}
                        defaultPageSize={14}
                        defaultFiltered={[
                            {
                                id: "season",
                                value: currentSeason && currentSeason.id,
                            },
                        ]}
                        filterable
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
                </div>
                <MessageModal
                    id={MESSAGE_MODAL_ID}
                    recipients={recipients}
                    message={this.state.message}
                    onChange={e =>
                        this.setState({
                            message: {
                                ...this.state.message,
                                [e.target.name]: e.target.value,
                            },
                        })
                    }
                    onSend={() => this.sendReminderMail()}
                />
            </div>
        );
    }
}

export default DuePaymentList;
