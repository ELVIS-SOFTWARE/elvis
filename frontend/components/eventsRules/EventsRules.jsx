import React, {Component, Fragment} from 'react';
import Select, {makeAnimated} from "react-select";
import ReactTable from "react-table";
import Modal from "react-modal";
import {Field, Form} from "react-final-form";
import {required} from "../../tools/validators";
import Input from "../common/Input";
import {csrfToken} from "../utils";
import swal from "sweetalert2";

const requestData = (pageSize, page, sorted, filtered, format) => {
    return fetch(`/events_rules/list${format ? "." + format : ""}`, {
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
            sorted:sorted[0],
            filtered,
        }),
    });
};

class EventsRules extends Component {

    constructor(props) {
        super(props);

        this.state = {
            data: [],
            pages: null,
            sorted: '',
            loading: false,
            filter: {},
            isRuleModalOpen: false,
            isModifyRuleModalOpen: false,
            label: "",
            selected: null,
            initialValues: {
                id: null,
                event: "",
                name: "",
                sendSMS: false,
                sendMail: false,
                templateName: "",
                selectedActions: []
            }
        };

        this.fetchData = this.fetchData.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onUpdateSubmit = this.onUpdateSubmit.bind(this);
        this.openModifyRuleModal = this.openModifyRuleModal.bind(this);
    }

    fetchData(state) {
        this.setState({ loading: true, filter: state });

        requestData(
            state.pageSize,
            state.page,
            state.sorted,
            state.filtered
        )
            .then(response => response.json())
            .then(data => {
                const res = {
                    data: data.rules,
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
    }

    openRuleModal() {
        this.setState({ isRuleModalOpen: true });
    }

    closeRuleModal() {
        this.setState({ isRuleModalOpen: false });
    }

    openModifyRuleModal(event) {
        console.log(event);

        let i
        if (event.templateName != null && event.templateName != "null") {
            i = _.findIndex(this.props.templateNames, { value: JSON.parse(event.templateName).value });
        }

        let selectedActions = [];

        event.sendSMS ?
            selectedActions.push({value: 'sendSMS', label: 'Envoyer un SMS'})
        : null;

        event.sendMail ?
            selectedActions.push({value: 'sendMail', label: 'Envoyer un Mail'})
        : null;


        this.setState({
            isModifyRuleModalOpen: true,
            initialValues: {
                id: event.id,
                event: JSON.parse(event.event).label,
                name: event.name,
                sendSMS: event.sendSMS,
                sendMail: event.sendMail,
                templateName: event.templateName ? this.props.templateNames[i] : "",
                sendTo: event.carbon_copy ? JSON.parse(event.carbon_copy) : "",
                selectedActions: selectedActions,
            }
        });
    }

    closeModifyRuleModal() {
        this.setState({ isModifyRuleModalOpen: false });
    }

    onSubmit(e) {
        if (e.event !== undefined && e.action !== undefined) {
            let alreadyExists = false;

            this.state.data.forEach((template, index) => {
                if (JSON.parse(template.event).value === e.event.value)
                    alreadyExists = true;
            })

            if (!alreadyExists) {
                fetch(
                    `/events_rules/`,
                    {
                        method: "POST",
                        credentials: "same-origin",
                        headers: {
                            "X-CSRF-Token": csrfToken,
                            "Content-Type": "application/json",
                        },

                        body: JSON.stringify({
                            name: e.name,
                            event: e.event,
                            action: e.action,
                        }),
                    }
                ).then(response => {
                    if (!response.ok)
                        swal("Erreur", "Erreur lors de l'acheminement", "error")

                    return response.json()
                }).then(json => {
                    swal("Réussite", "Règle créée", "success");
                    this.fetchData(this.state.filter);
                    this.closeRuleModal();
                });
            } else {
                swal("Erreur", "L'évènement \"" + e.event.label + "\" à déjà une règle", "error")
            }
        } else {
            swal("Erreur", "Veuillez spécifier tous les champs", "error")
        }
    }

    onUpdateSubmit(e) {
        fetch(
            `/events_rules/` + e.id,
            {
                method: "PATCH",
                credentials: "same-origin",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    "Content-Type": "application/json",
                },

                body: JSON.stringify({
                    id: e.id,
                    name: e.name,
                    event: e.event,
                    templateName: e.template,
                    action: e.action,
                    sendMail: e.sendMail,
                    sendSMS: e.sendSMS,
                    sendTo: e.sendTo
                }),
            }
        ).then(response => {
            if (!response.ok)
                swal("Erreur", "Erreur lors de l'acheminement", "error")

            return response.json()
        }).then(json => {
            swal("Réussite", "Règle mise à jour", "success");
            this.fetchData(this.state.filter);
            this.closeModifyRuleModal();
        });
    }

    DeleteRulesProcess(e, id) {
        e.preventDefault();
        swal({
            title: "Êtes vous sûr de vouloir supprimer cette règle ?",
            type: "warning",
            confirmButtonText: "Oui !",
            cancelButtonText: "Annuler",
            showCancelButton: true,
        }).then(a => {
            if (a.value) {
                fetch(`/events_rules/` + id,
                    {
                        method: "DELETE",
                        credentials: "same-origin",
                        headers: {
                            "X-CSRF-Token": csrfToken,
                            "Content-Type": "application/json",
                        },

                        body: JSON.stringify({
                            id: id,
                        }),
                    }).then(response => {
                    if (!response.ok)
                        swal("Erreur", "Erreur lors de l'acheminement", "error")

                    this.fetchData(this.state.filter);
                    swal("Réussite", "Règle supprimée", "success");
                })
            }
        })
    }

    render () {
        const { data, pages, loading } = this.state;
        const animatedComponents = makeAnimated();

        const columns = [
            {
                id: "ruleName",
                Header: "Nom de la règle",
                accessor: "name",
            },
            {
                id: "eventName",
                Header: "Lors de l'évènement",
                accessor: (event) => {
                    return <a onClick={() => this.openModifyRuleModal(event)}>{JSON.parse(event.event).label}</a>
                }
            },
            {
                id: "actions",
                Header: "Actions",
                Cell: props => {
                    return (
                        <div className="btn-wrapper text-center">
                            {props.original.sendMail ?
                                props.original.templateName && props.original.templateName != "null" ?
                                        <a
                                            className="btn btn-sm btn-primary m-r-sm mb-3"
                                            href={ props.original.templateName && props.original.templateName != "null" ?
                                                "/notification_templates/edit/" + JSON.parse(props.original.templateName).value
                                                + "?event=" + JSON.parse(props.original.event).value : ""
                                            }
                                        >
                                            <i className="fas fa-edit" /> Mail
                                        </a>
                                   :
                                        <a
                                            className="btn btn-primary btn-sm m-r-sm mb-3"
                                            disabled={true}
                                        >
                                            <i className="fas fa-edit" /> Mail
                                        </a>
                            : "" }

                            {props.original.sendSMS ?
                                <a
                                    className="btn btn-sm btn-warning m-r-sm mb-3 disabled"
                                    // onClick={(e) => this.handleSMSProcess(e, props.original.id)}
                                >
                                    <i className="fas fa-edit" /> SMS
                                </a>
                            : "" }

                            <a
                                className="btn btn-sm btn-danger mb-3"
                                onClick={(e) => this.DeleteRulesProcess(e, props.original.id)}
                            >
                                <i className="fas fa-times" />
                            </a>
                        </div>
                    )},
                sortable: false,
                filterable: false,
                width: 300
            },
        ];


        const events = [
            { value: 'user_created', label: 'un utilisateur est créé' },
            { value: 'activity_accepted', label: 'une proposition d\'activité est acceptée' },
            { value: 'activity_assigned', label: 'une activité est assignée' },
            { value: 'application_created', label: 'une application est créée' }
        ]

        const actions = [
            { value: 'sendSMS', label: 'Envoyer un SMS' },
            { value: 'sendMail', label: 'Envoyer un Mail' },
        ]

        const sendOptions = [
            { value: 'is_admin', label: 'Aux administrateurs'},
            { value: 'is_teacher', label: 'Aux professeurs' },
            { value: 'is_paying', label: 'Aux payeurs' },
        ]

        const ReactSelectAdapter = ({ input, ...rest }) => (
            <Select {...input} {...rest} searchable required />
        )

        return (
            <Fragment>
                <div className="row">
                    <div className="col-12">
                        <div className="col-8 margin-auto">
                            <ReactTable
                                id="templateTable"
                                data={data}
                                manual
                                loading={loading}
                                onFetchData={this.fetchData}
                                columns={columns}
                                // getTrProps={(state, rowInfo) => {
                                //     if (rowInfo && rowInfo.row) {
                                //         return {
                                //             onClick: (e) => {
                                //                 this.setState({
                                //                     selected: rowInfo.original.id,
                                //                     isModifyRuleModalOpen : true
                                //                 })
                                //             },
                                //         }
                                //     } else {
                                //         return {}
                                //     }
                                // }}
                                resizable={false}
                                showPagination={false}
                                previousText="Précédent"
                                nextText="Suivant"
                                loadingText="Chargement..."
                                noDataText="Aucune donnée"
                                pageText="Page"
                                ofText="sur"
                                rowsText="résultats"
                                minRows={1}
                            />
                            <div className="pull-right mt-3">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => this.openRuleModal()}
                                >
                                    Ajouter une règle
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <Modal
                    isOpen={this.state.isRuleModalOpen}
                    onRequestClose={() => this.closeRuleModal()}
                    className="modal-body"
                    ariaHideApp={false}
                    contentLabel="Ajout d'un evenement"
                >
                    <h2 className="modal-header">
                        Ajouter une Règles
                    </h2>
                    <div className="content">
                        <div className="form-group">
                            <Form
                                onSubmit={this.onSubmit}
                                render={({ handleSubmit }) => (
                                    <form onSubmit={handleSubmit} className="p-lg">
                                        <div className="row justify-content-center">
                                            <div className="pl-4 col-12">
                                                <Field
                                                    label="Nom de la règle"
                                                    name="name"
                                                    type="text"
                                                    validate={required}
                                                    required
                                                    render={Input}
                                                />
                                            </div>

                                            <div>
                                                <label className="ml-4 mt-3">Ajout d'une condition</label>
                                                <Field
                                                    name="event"
                                                    component={ReactSelectAdapter}
                                                    options={events}
                                                    className="col-12"
                                                />
                                            </div>

                                            <div>
                                                <label className="ml-4 mt-5">Ajout d'une action</label>
                                                <Field
                                                    className="col-12"
                                                    name="action"
                                                    component={ReactSelectAdapter}
                                                    options={actions}
                                                    isMulti
                                                    components={animatedComponents}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-5">
                                            <button
                                                onClick={() => this.closeRuleModal()}
                                                className="btn btn-white"
                                            >
                                                Retour
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn btn-primary pull-right"
                                            >
                                                Je confirme
                                            </button>
                                        </div>
                                    </form>
                                )}
                            />
                        </div>
                    </div>
                </Modal>

                <Modal
                    isOpen={this.state.isModifyRuleModalOpen}
                    onRequestClose={() => this.closeModifyRuleModal()}
                    className="modal-body"
                    ariaHideApp={false}
                    contentLabel="Ajout d'un evenement"
                >
                    <h2 className="modal-header">
                        Modifier la règle
                    </h2>
                    <div className="content">
                        <div className="form-group">
                            <Form
                                onSubmit={this.onUpdateSubmit}
                                initialValues={this.state.initialValues}
                                render={({ handleSubmit,  form: {getState}}) => (
                                    <form onSubmit={handleSubmit} className="p-lg">
                                        <div className="row justify-content-center">
                                            <div className="pl-4 col-12 mt-3">
                                                <Field
                                                    label="Condition"
                                                    name="event"
                                                    render={Input}
                                                    className="col-12"
                                                    type="text"
                                                    disabled
                                                />
                                            </div>

                                            <div className="pl-4 col-12 mt-3">
                                                <Field
                                                    label="Nom de la règle"
                                                    name="name"
                                                    type="text"
                                                    validate={required}
                                                    render={Input}
                                                />
                                            </div>

                                            <div>
                                                <label className="ml-4">Action</label>
                                                <Field
                                                    className="col-12"
                                                    name="action"
                                                    component={ReactSelectAdapter}
                                                    options={actions}
                                                    isMulti
                                                    required
                                                    components={animatedComponents}
                                                    defaultValue={this.state.initialValues.selectedActions}
                                                />
                                            </div>

                                            <div className="mt-4">
                                                <label className="ml-4">Template</label>
                                                <Field
                                                    className="col-12"
                                                    name="template"
                                                    component={ReactSelectAdapter}
                                                    options={this.props.templateNames}
                                                    components={animatedComponents}
                                                    defaultValue={this.state.initialValues.templateName}
                                                />
                                            </div>

                                            <div className="mt-4">
                                                <label className="ml-4">Envoyer une copie du mail</label>
                                                <Field
                                                    className="col-12"
                                                    name="sendTo"
                                                    component={ReactSelectAdapter}
                                                    options={sendOptions}
                                                    components={animatedComponents}
                                                    isMulti
                                                    defaultValue={this.state.initialValues.sendTo}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-5">
                                            <button
                                                type="button"
                                                onClick={() => this.closeModifyRuleModal()}
                                                className="btn btn-white"
                                            >
                                                Retour
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn btn-primary pull-right"
                                            >
                                                Je confirme
                                            </button>
                                        </div>
                                    </form>
                                )}
                            />
                        </div>
                    </div>
                </Modal>

            </Fragment>
        )};
}

export default EventsRules