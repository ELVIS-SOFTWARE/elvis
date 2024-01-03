import React, { Fragment, useState } from "react";
import ReactTable from "react-table";
import * as StopReasons from './utils/StopReasons';
import Modal from "react-modal";
import * as api from "../tools/api";
import { csrfToken, optionMapper } from "./utils";
import _ from "lodash";

const MODAL_STYLE = {
    content: {
        margin: "auto",
        maxWidth: "1200px",
        height: "720px",
    }
};

const TABLE_COLUMNS = [
    {
        id: 'last_name',
        Header: 'Nom',
        width: 175,
        accessor: d => `${_.get(d, "pre_application.user.first_name")} ${_.get(d, "pre_application.user.last_name")}`,
        maxWidth: 100,
        filterable: false,
        sortable: false,
    },
    {
        id: "season",
        width: 150,
        Header: "Saison",
        accessor: d => _.get(d, "pre_application.season.label"),
        filterable: false,
        sortable: false,
    },
    {
        id: "activity",
        Header: "Activité",
        accessor: d => {
            const activityLabel = _.get(d, "activity.activity_ref.label");
            const teachersName = `${_.get(d, "activity.teacher.first_name")} ${_.get(d, "activity.teacher.last_name")}`;

            return `${activityLabel} avec ${teachersName}`;
        },
    },
    {
        id: "comment",
        Header: "Raison",
        accessor: d => {
            const foundReason = StopReasons.STOP_REASONS.find(r => r.id == d.comment);
            
            return _.get(foundReason, "label") || d.comment;
        },
    },
    {
        Header: "Actions",
        id: "actions",
        sortable: false,
        width: 100,
        Cell: props => {
            return (
                <div className="flex flex-center-justified">
                    <button
                        className="btn btn-primary btn-xs m-r-sm"
                        data-toggle="modal"
                        title="Annuler la demande d'arrêt"
                        onClick={id =>
                            handleSelectStopApplicationToEdit(
                                props.original
                            )
                        }
                    >
                        <i className="fas fa-trash" />
                    </button>
                </div>
            );
        },
    },
];

const handleSelectStopApplicationToEdit = (action) => {
    let actions = [
        fetch(
            `/pre_application/${
                action.id
            }/process?auth_token=${csrfToken}`,
            {
                method: "PATCH",
                credentials: "same-origin",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    pre_app_action: null, // set preapplication at "to renew" state
                    comment:"",
                    status: false,
                }),
            }
        ).then(() => document.location.reload()),
    ];
}

export default function StopList({ seasons }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [season, setSeason] = useState(undefined);

    const fetchData = () => {
        setLoading(true);

        api
            .set()
            .success(data => {
                setLoading(false);
                setData(data)
            })
            .get("/pre_application_activities/stop");
    };

    const handleOpen = () => {
        setIsOpen(true);
        fetchData();
    }

    return <Fragment>
        <button
            onClick={handleOpen}
            className="btn btn-primary"
            data-tippy-content="Liste des arrêts">
            <i className="fas fa-times-circle"/>
        </button>

        <Modal
            ariaHideApp={false}
            style={MODAL_STYLE}
            onRequestClose={() => setIsOpen(false)}
            isOpen={isOpen}>
            <div className="flex flex-space-between-justified">
                <h1>Liste des arrêts ({data.filter(d => !season || d.pre_application.season_id === season.id).length} trouvés)</h1>
                <div>
                    <label>Saison</label>
                    <select
                        className="form-control"
                        value={season ? season.id : ""}
                        onChange={e => setSeason(seasons.find(s => s.id === parseInt(e.target.value)))}>
                        <option value="">TOUTES</option>
                        {_.orderBy(seasons, "start", "desc").map(optionMapper())}
                    </select>
                </div>
            </div>
            <hr style={{marginBottom: "0"}}/>
            <ReactTable
                className="m-b-sm"
                defaultPageSize={15}
                data={data.filter(d => !season || d.pre_application.season_id === season.id)}
                pageSizeOptions={[10,15,20]}
                loading={loading}
                columns={TABLE_COLUMNS} />
        </Modal>
    </Fragment>;
}