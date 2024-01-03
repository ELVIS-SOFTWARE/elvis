import React from "react";
import { MESSAGES } from "../../tools/constants";
import InputSelect from "../common/InputSelect";
import { toast } from "react-toastify";
import * as api from "../../tools/api.js";
import AddCourseSummary from "./AddCourseSummary";

export default class AddActivityForCourse extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            href_path: this.props.href_path,
            activityRefId: this.props.activityRefId,
            activityRefKindId: this.props.activityRefKindId,
            activityRefs: undefined,
            activityRefKinds: undefined,
            activityRefOptions: undefined,
            activityRefKindOptions: undefined,
            summary: this.props.summary,
        };
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
        api.get(`/activity_ref_kinds`).then(({ data, error }) => {
            if (error) {
                console.log(error);
            } else {
                const activityRefKindOptions = data.map(activityRefKind => {
                    return {
                        value: activityRefKind.id,
                        label: activityRefKind.name,
                    };
                });
                this.setState({
                    ...this.state,
                    activityRefKinds: data,
                    activityRefKindOptions: activityRefKindOptions,
                });
            }
        });

        api.get(`/activity_ref`).then(({ data, error }) => {
            if (error) {
                console.log(error);
            } else {
                const activityRefOptions = data.map(activityRef => {
                    return {
                        value: activityRef.id,
                        label: activityRef.label,
                    };
                });
                this.setState({
                    ...this.state,
                    activityRefs: data,
                    activityRefOptions: activityRefOptions,
                });

                if (activityRefOptions.length == 1) {
                    const activityRefId = activityRefOptions[0].value.toString();
                    this.setState({ activityRefId: activityRefId });
                    this.handleChange(activityRefId);
                }
            }
        });
    }

    isValidated() {
        if (!this.state.activityRefId) {
            toast.error(MESSAGES.err_must_choose_activity, { autoClose: 3000 });
            return false;
        }
        return true;
    }

    handleChange(newValues) {
        const update = { ...this.state, ...newValues };

        let selectedActivityRef = this.state.activityRefs.find(
            activityRef => activityRef.id == update.activityRefId
        );

        update.summary = {
            ...update.summary,
            activityRef: selectedActivityRef
                ? selectedActivityRef.label
                : undefined,
        };

        this.setState(update);

        if (selectedActivityRef) {
            this.props.onChange({
                activityRef: {
                    id: selectedActivityRef.id,
                    label: selectedActivityRef.label,
                },
                activityRefKind: this.state.activityRefKindId,
                summary: { ...update.summary },
            });
        }
    }

    render() {
        const {
            activityRefId,
            activityRefKindId,
            activityRefs,
            activityRefOptions,
            activityRefKindOptions,
            href_path,
            summary,
        } = this.state;

        return (
            <div className="row">
                <div className="col-md-8">
                    <div className="ibox">
                        <div className="ibox-title flex">
                            <i className="fa fa-music m-sm"></i>
                            <h3>Choix de l'activité</h3>
                        </div>
                        <div className="ibox-content">
                            <div className="row">
                                <div className="col-md-6">
                                    {activityRefKindOptions && (
                                        <InputSelect
                                            input={{
                                                name: "activity_ref_kind",

                                                onChange: e => {
                                                    let newOptions = [];

                                                    if (
                                                        e.target.value.length ==
                                                        0
                                                    ) {
                                                        newOptions = activityRefs.map(
                                                            activityRef => {
                                                                return {
                                                                    value:
                                                                        activityRef.id,
                                                                    label:
                                                                        activityRef.label,
                                                                };
                                                            }
                                                        );
                                                    } else {
                                                        newOptions = activityRefs
                                                            .filter(
                                                                activityRef =>
                                                                    activityRef.activity_ref_kind_id ==
                                                                    e.target
                                                                        .value
                                                            )
                                                            .map(
                                                                activityRef => {
                                                                    return {
                                                                        value:
                                                                            activityRef.id,
                                                                        label:
                                                                            activityRef.label,
                                                                    };
                                                                }
                                                            );
                                                    }

                                                    const activitiesAvailable =
                                                        newOptions.length > 0 &&
                                                        e.target.value.length >
                                                            0;

                                                    this.handleChange({
                                                        activityRefOptions: newOptions,
                                                        activityRefKindId:
                                                            e.target.value,
                                                        activityRefId: activitiesAvailable
                                                            ? newOptions[0]
                                                                  .value
                                                            : "",
                                                    });
                                                },
                                                value: activityRefKindId,
                                            }}
                                            meta={{}}
                                            label="Filtrer par famille d'activité"
                                            options={activityRefKindOptions}
                                            button={{
                                                icon: "fa fa-plus-circle",
                                                href_path: `${href_path}/activity_ref_kind/new`,
                                                text: "",
                                                tooltip:
                                                    "Ajouter une famille d'activité",
                                            }}
                                        />
                                    )}
                                    {activityRefOptions && (
                                        <InputSelect
                                            input={{
                                                name: "activityRef",
                                                onChange: e =>
                                                    this.handleChange({
                                                        activityRefId:
                                                            e.target.value,
                                                    }),
                                                value: activityRefId,
                                            }}
                                            meta={{}}
                                            label="Activité"
                                            required={true}
                                            options={activityRefOptions}
                                            button={{
                                                icon: "fa fa-plus-circle",
                                                href_path: `${href_path}/activity_ref/new`,
                                                text: "",
                                                tooltip: "Ajouter une activité",
                                            }}
                                        />
                                    )}
                                    {!activityRefOptions &&
                                        !activityRefKindOptions && (
                                            <div>
                                                <label>
                                                    Pas encore d'activité
                                                    renseignée ?
                                                </label>
                                                <a
                                                    href={`${href_path}/activity_ref_kind/new`}
                                                    className="btn btn-primary btn-md"
                                                >
                                                    Créer une activité
                                                </a>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <AddCourseSummary
                        summary={summary}
                        handleSubmit={this.handleSubmit}
                    />
                </div>
            </div>
        );
    }
}
