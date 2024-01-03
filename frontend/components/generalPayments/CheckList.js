import _, { filter } from "lodash";
import React from "react";
import ReactTableFullScreen from "../ReactTableFullScreen";
import Switch from "react-switch";
import { makeDebounce } from "../../tools/inputs";
import {
    csrfToken,
    ISO_DATE_FORMAT,
    findAndGet,
    optionMapper,
    reactOptionMapper,
} from "../utils/index.js";

require("moment/locale/fr");

const FILTER_STORAGE_KEY = "general_checks_list_filters";

const defaultTableProps = () => ({
    page: 0,
    pageSize: 10,
    sorted: [{ id: "cashing_date", desc: true }],
    filtered: [{ id: "check_status", value: "all" }],
    resized: [],
    expanded: {},
});

const NB_DISPLAYED_RECIPIENTS = 3;
const MESSAGE_MODAL_ID = "messagesModal";

const debounce = makeDebounce();

const requestData = (pageSize, page, sorted, filtered, format) => {
    return fetch(`/payments/checklist${format ? `.${format}` : ""}`, {
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
        .then(response => {
            if (!format || format === "json") return response.json();
            else {
                return response.blob();
            }
        })
        .then(data => {
            if (!format || format === "json") {
                return {
                    data: data.payments,
                    pages: data.pages,
                    rowsCount: data.rowsCount,
                    totalAmount: data.totalAmount,
                };
            } else {
                return data;
            }
        });
};

const putCheckStatus = (id, check_status) => {
    let format = "json";
    return fetch(`/payments/check_status${format ? `.${format}` : ""}`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
            "X-CSRF-Token": csrfToken,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            id,
            check_status,
        }),
    });
};

class CheckList extends React.Component {
    constructor(props) {
        super(props);

        const localStorageValue = localStorage.getItem(FILTER_STORAGE_KEY);
        const filter =
            localStorageValue != null
                ? JSON.parse(localStorageValue)
                : defaultTableProps();

        this.state = {
            data: [],
            pages: null,
            message: {
                title: "Rappel pour paiement",
                content: "",
                isEmail: true,
                isSMS: false,
            },
            bulkEdit: {},
            page: 0,
            filter,
            loading: true,
            rowsCount: 0,
            totalAmount: 0,
            targets: [],
        };

        this.fetchData = this.fetchData.bind(this);
    }

    componentDidMount() {
        this.mounted = true;
        this.fetchData(this.state.filter, 0);
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    componentDidUpdate() {
        localStorage.setItem(
            FILTER_STORAGE_KEY,
            JSON.stringify(this.state.filter)
        );
    }

    fetchData(filter, delay = 400) {
        this.setState({ filter });

        debounce(() => {
            if (!this.mounted) return;
            this.setState({ loading: true, file: undefined });
            requestData(
                filter.pageSize,
                filter.page,
                filter.sorted,
                filter.filtered,
                "json"
            ).then(res => {
                if (!this.mounted) return;
                this.setState({
                    ...res,
                    loading: false,
                });
            });
        }, delay);
    }

    resetFilters() {
        localStorage.setItem(
            FILTER_STORAGE_KEY,
            JSON.stringify(defaultTableProps())
        );
        this.setState({ filter: defaultTableProps() }, () => {
            this.fetchData(this.state.filter);
        });
    }

    handleChangeSwitch(checked, check) {
        putCheckStatus(check.id, checked).then(() =>
            this.setState({
                data: this.state.data.map(p => ({
                    ...p,
                    check_status: p.id === check.id ? checked : p.check_status,
                })),
            })
        );
    }

    handleChangeReferenceDate(value) {
        const filter = { ...this.state.filter };
        const indexFiltered = _.keyBy(filter.filtered, "id");
        indexFiltered.reference_date = { id: "reference_date", value };
        filter.filtered = Object.values(indexFiltered);
        this.fetchData(filter);
    }

    handleChangeRadio(event) {
        const filter = { ...this.state.filter };
        const indexFiltered = _.keyBy(filter.filtered, "id");
        indexFiltered.check_status = {
            id: "check_status",
            value: event.target.value,
        };
        filter.filtered = Object.values(indexFiltered);
        this.fetchData(filter);
    }

    render() {
        const { data, pages, loading } = this.state;

        let referenceDate = this.state.filter.filtered.find(
            obj => obj.id === "reference_date"
        );
        referenceDate = referenceDate == undefined ? "" : referenceDate.value;

        let radioCheckValue = this.state.filter.filtered.find(
            obj => obj.id === "check_status"
        );
        radioCheckValue =
            radioCheckValue == undefined ? "" : radioCheckValue.value;

        const columns = [
            {
                Header: "Payeur",
                // maxWidth: 175,
                id: "users.last_name",
                Cell: props => {
                    const user = _.get(
                        props.original,
                        "due_payment.payment_schedule.user"
                    );
                    return (
                        (user && (
                            <a href={`/payments/summary/${user.id}`}>
                                {`${user.last_name} ${user.first_name}`}
                            </a>
                        )) ||
                        "Inconnu"
                    );
                },
            },
            {
                Header: "N° Adhérent associés",
                // maxWidth: 100,
                id: "users.adherent_number",
                Cell: props => {
                    const user = _.get(
                        props.original,
                        "due_payment.payment_schedule.user"
                    );
                    let family = _.get(user, "get_users_paying_for_self");
                    family = (user.students.length ? [user] : []).concat(
                        family
                    );
                    // check for unicity
                    let familyList = [];
                    let map = new Map();
                    for (const member of family) {
                        if (!map.has(member.id)) {
                            map.set(member.id, true);
                            familyList.push(member);
                        }
                    }
                    // build the list
                    let numbersList = familyList.map(function(member, index) {
                        return (
                            <li key={index}>
                                {member.adherent_number} - {member.last_name}{" "}
                                {member.first_name}
                            </li>
                        );
                    });
                    return user && <ul>{numbersList}</ul>;
                },
                sortable: false,
                filterable: true,
            },
            {
                Header: "Montant",
                maxWidth: 100,
                id: "payments.amount",
                style: {
                    display: "block",
                    textAlign: "right",
                },
                accessor: d => `${d.amount || "?"} €`,
                filterable: true,
                sortable: true,
            },
            {
                Header: "N° de chèque",
                // maxWidth: 100,
                id: "check_number",
                style: {
                    display: "block",
                    textAlign: "right",
                },
                accessor: d => `${d.check_number || ""}`,
                filterable: true,
                sortable: true,
            },
            {
                Header: "Statut",
                // maxWidth: 100,
                id: "check_status",
                accessor: "check_status",
                Cell: d => {
                    return (
                        <label>
                            <Switch
                                className="react-switch"
                                onChange={(checked, event, id) => {
                                    return this.handleChangeSwitch(
                                        checked,
                                        d.original
                                    );
                                }}
                                checked={d.value}
                            />
                        </label>
                    );
                },
                filterable: false,
            },
        ];

        const events = [];

        return (
            <div>
                <div
                    className="flex flex-space-between-justified flex-center-aligned reglement-table-header m-b-sm"
                    style={{ width: "100%" }}
                >
                    <div className="flex flex-center-aligned">
                        <h2 className="m-r">Date de réglement :</h2>
                        <div
                            className="input-group"
                            data-tippy-content="Date de réglement"
                            style={{ maxWidth: "200px" }}
                        >
                            <div className="input-group-addon">
                                <i className="fas fa-calendar"></i>
                            </div>
                            <input
                                id="headcount-reference"
                                type="date"
                                className="form-control"
                                value={referenceDate}
                                onChange={e =>
                                    this.handleChangeReferenceDate(
                                        e.target.value
                                    )
                                }
                            />
                        </div>
                        <div
                            className="m-md"
                            onChange={e => this.handleChangeRadio(e)}
                        >
                            <label className="radio-inline">
                                <input
                                    type="radio"
                                    value="all"
                                    name="check_status_radio"
                                    checked={radioCheckValue === "all"}
                                    onChange={() => {}}
                                />
                                Tous les chèques
                            </label>
                            <label className="radio-inline">
                                <input
                                    type="radio"
                                    value="true"
                                    name="check_status_radio"
                                    checked={radioCheckValue === "true"}
                                    onChange={() => {}}
                                />
                                Chèques pointés
                            </label>
                            <label className="radio-inline">
                                <input
                                    type="radio"
                                    value="false"
                                    name="check_status_radio"
                                    checked={radioCheckValue === "false"}
                                    onChange={() => {}}
                                />
                                Chèques non pointés
                            </label>
                        </div>
                        <button
                            className="btn btn-primary m-r"
                            data-tippy-content="Recharger la liste"
                            onClick={() => this.fetchData(this.state.filter)}
                        >
                            <i className="fas fa-sync" />
                        </button>
                        <button
                            data-tippy-content="Réinitialiser les filtres"
                            className="btn btn-primary m-r"
                            onClick={() => this.resetFilters()}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                        <button
                            data-tippy-content="Mettre le tableau en plein écran"
                            className="btn btn-primary m-r"
                            onClick={() => events[0]()}
                        >
                            <i className="fas fa-expand-arrows-alt"></i>
                        </button>

                        <h2 className="m-r">
                            Nombre de chèques : {this.state.rowsCount}
                        </h2>
                    </div>

                    <div className="ibox-title-right">
                        <span>
                            Montant total:{" "}
                            {new Intl.NumberFormat("fr-FR", {
                                style: "currency",
                                currency: "EUR",
                            }).format(this.state.totalAmount)}
                        </span>
                    </div>
                </div>

                <div className="ibox-content no-padding">
                    <ReactTableFullScreen
                        events={events}
                        data={data}
                        manual
                        pages={pages}
                        loading={loading}
                        columns={columns}
                        pageSizeOptions={[5, 10, 11, 15, 20, 50, 100]}
                        page={
                            this.state.filter.page <= this.state.pages
                                ? this.state.filter.page
                                : this.state.pages - 1
                        }
                        pageSize={this.state.filter.pageSize}
                        sorted={this.state.filter.sorted}
                        filtered={this.state.filter.filtered}
                        onPageChange={page =>
                            this.fetchData({ ...this.state.filter, page })
                        }
                        onPageSizeChange={(pageSize, page) =>
                            this.fetchData({
                                ...this.state.filter,
                                page,
                                pageSize,
                            })
                        }
                        onSortedChange={sorted => {
                            console.log(sorted);
                            if (sorted[0].id === "payments.amount") {
                                this.setState({
                                    data: _.orderBy(
                                        this.state.data,
                                        ["amount"],
                                        [sorted[0].desc ? "asc" : "desc"]
                                    ),
                                    filter: { ...this.state.filter, sorted },
                                });
                            } else {
                                this.fetchData({
                                    ...this.state.filter,
                                    sorted,
                                });
                            }
                        }}
                        onFilteredChange={filtered =>
                            this.fetchData({
                                ...this.state.filter,
                                filtered,
                            })
                        }
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
            </div>
        );
    }
}

export default CheckList;
