import React from "react";
import _ from "lodash";

import LevelInfos from "./personalInfos/LevelInfos.js";
import UserForm from "./userForm/UserForm";
import TabbedComponent from "./utils/ui/tabs";
import * as api from "../tools/api.js";
import {redirectTo} from "../tools/url";
import {infosFromUser} from "../tools/obj";
import {fullname} from "../tools/format";
import swal from "sweetalert2";
import Roles from "./personalInfos/Roles";

class UserEdit extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isFetching: false,
            infos: infosFromUser(this.props.user),
        };
    }

    handleChangeEvaluationLevel(evt) {
        let infos = this.state.infos;
        infos["evaluation_level_ref_id"] = evt.target.value;
        this.setState({infos});
    }

    handleSubmit(values) {
        this.setState({
            infos: {
                ...this.state.infos,
                ...values,
            },
        });

        api.set()
            .before(() => this.setState({isFetching: true}))
            .success(() => {
                redirectTo(`/users/${this.props.user.id}`);
            })
            .error((res) => {
                swal({
                    title: "Erreur !",
                    type: "error",
                    text: res
                });
                this.setState({isFetching: false});
            })
            .patch(
                `/users/${this.props.user.id}${
                    this.props.currentUserIsAdmin
                        ? ""
                        : `?auth_token=${this.props.user.authentication_token}`
                }`,
                {user: {...this.state.infos, ...values}}
            );
    }

    handleUpdateLevel(id, field, value) {
        const updatedLevels = this.state.infos.levels.map(l => ({
            ...l,
            [field]: l.id == id ? value : l[field],
            isUpdated: true,
        }));

        this.setState({
            infos: {
                ...this.state.infos,
                levels: updatedLevels,
            },
        });
    }

    handleNewLevel(l) {
        const maxId = _.maxBy(this.state.infos.levels, "id") || 0;
        const newId = (maxId && maxId.id) + 1;

        const level = {
            ...l,
            id: newId,
            isNew: true,
        };

        this.setState({
            infos: {
                ...this.state.infos,
                levels: [...this.state.infos.levels, level],
            },
        });
    }

    render() {
        return (
            <React.Fragment>
                <div className="row wrapper border-bottom white-bg page-heading">
                    <h2>
                        Édition du profil : <b>{fullname(this.props.user)}</b>
                    </h2>
                </div>

                <TabbedComponent
                    tabs={[
                        {
                            id: "coordinates",
                            header: "Coordonnées",
                            body: (
                                <UserForm
                                    user={{
                                        is_admin: this.props.currentUserIsAdmin,
                                    }}
                                    console
                                    shouldCheckGdpr={
                                        !this.props.currentUserIsAdmin
                                    }
                                    initialValues={this.state.infos}
                                    schoolName={this.props.schoolName}
                                    displayIdentificationNumber={this.props.countryCode==="BE"}
                                    displaySubmit
                                    submitting={this.state.isFetching}
                                    onSubmit={this.handleSubmit.bind(this)}
                                    consent_docs={this.props.consent_docs}
                                    organizationOptions={this.props.organizationOptions}
                                />
                            ),
                            active: true,
                        },
                        (this.props.current_user || {}).is_admin || (this.props.current_user || {}).is_teacher ? {
                            id: "levels",
                            header: "Évaluations",
                            body: (
                                <LevelInfos
                                    infos={this.state.infos}
                                    seasons={this.props.seasons}
                                    activityRefs={this.props.activity_refs}
                                    handleNewLevel={l => this.handleNewLevel(l)}
                                    handleRemoveLevel={id =>
                                        this.setState({
                                            infos: {
                                                ...this.state.infos,
                                                levels: this.state.infos.levels.filter(
                                                    l => l.id != id
                                                ),
                                            },
                                        })
                                    }
                                    evaluationLevels={
                                        this.props.evaluation_levels
                                    }
                                    handleUpdateLevel={(id, f, v) =>
                                        this.handleUpdateLevel(id, f, v)
                                    }
                                    handleSaveInfos={() => this.handleSubmit()}
                                />
                            ),
                        } : undefined,
                        (this.props.current_user || {}).is_admin ? {
                            id: "roles",
                            header: "Rôles",
                            body: <Roles
                                    user={this.props.user}
                                    lessonsPlanned={this.props.lessonsPlanned}
                                    onSubmit={this.handleSubmit.bind(this)} />
                    } : undefined
                        ]}>
                </TabbedComponent>

            </React.Fragment>
        );
    }
}

export default UserEdit;
