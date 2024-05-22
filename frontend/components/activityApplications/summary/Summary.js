import _ from "lodash";
import React from "react";
import CommentSection from "./../../CommentSection";
import Activity from "./Activity";
import { toast } from "react-toastify";
import swal from "sweetalert2";
import { csrfToken, findAndGet, ISO_DATE_FORMAT, optionMapper } from "../../utils";
import { getAnswersObject } from "../../evaluation/Evaluation";
import EvaluationForm from "../../evaluation/EvaluationForm";
import { patch } from "../../../tools/api";
import { PRE_APPLICATION_ACTION_LABELS } from "../../../tools/constants";
import EvaluationChoice from "../EvaluationChoice";
import ButtonModal from "../../common/ButtonModal";
import UserWithInfos from "../../common/UserWithInfos";
import * as ActivityApplicationStatus from "../../utils/ActivityApplicationsStatuses";
import { isValidDate } from "@fullcalendar/react";
import TimePreferencesStep from "../TimePreferencesStep";
import { PLANNING_MODE } from "../TimePreferencesStep";

const moment = require("moment");
require("moment/locale/fr");

class Summary extends React.Component {
    constructor(props) {
        super(props);

        this.stopDateInput = React.createRef();

        const defaultEvaluationId = _.get(
            this.props.student_evaluations
                .forms
                .map(e => e.form)
                .find(e => e.season_id === this.props.application.season_id),
            "id",
        ) || "";

        const defaultAppChangeQuestionnaireId = _.get(
            this.props.application_change_questionnaires
                .forms
                .map(e => e.form)
                .find(e => e.season_id === this.props.application.season_id &&
                    this.props.application.desired_activities.find(d => d.activity_ref_id === e.activity.activity_ref_id)),
            "id",
        ) || "";

        this.state = {
            application: this.props.application,
            status: this.props.application.activity_application_status,
            status_id: this.props.application.activity_application_status.id,
            begin_at: this.props.application.begin_at,
            status_updated_at: this.props.application.status_updated_at,
            referent_id: this.props.application.referent_id,
            referent: this.props.application.referent_id && _.find(this.props.admins, u => u.id == this.props.application.referent_id),
            suggestions: {},
            mail_sent: this.props.application.mail_sent,
            sendingMail: false,
            desiredActivities: this.props.application.desired_activities,
            addedSelectedActivities: [],
            additionalStudents: [],
            comments: this.props.application.comments,
            newComment: "",
            editedComment: null,
            stopped_at: this.props.application.stopped_at,
            studentEvaluationId: defaultEvaluationId,
            applicationChangeQuestionnaireId: defaultAppChangeQuestionnaireId,
            newStudentLevelQuestionnaireId: "",
            alertProposal: "",
        };
    }

    componentDidMount() {
        this.loadData();
    }

    loadData() {
        fetch(`/inscriptions/${this.props.application.id}.json`, {
            method: "GET",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                pragma: "no-cache",
                Accept: "application/json",
            },
        })
            .then(response => response.json())
            .then(application => {
                const desiredActivities = application.desired_activities;
                this.setState({
                    desiredActivities,
                });
            });
        this.handleAlertProposal();
    }

    isAlreadyBusy(timeInterval) {
        return _.chain(this.state.suggestions)
            .reduce((result, value, key) => _.concat(result, value), [])
            .filter(act =>
                _.includes(
                    _.map(act.users, u => u.id),
                    this.state.application.user_id,
                ),
            )
            .map(act => act.time_interval)
            .filter(
                ti =>
                    ti.start == timeInterval.start || ti.end == timeInterval.end,
            )
            .some()
            .value();
    }

    handleChangeStatus(evt) {
        const statusId = evt.target.value;

        this.setState({ status_id: statusId });
    }

    handleSaveStatus() {
        const isStopping = findAndGet(
            this.props.statuses,
            (s) => parseInt(s.id, 10) === parseInt(this.state.status_id, 10),
            "is_stopping",
        );

        const stoppedAt = isStopping && this.stopDateInput
            ? this.stopDateInput.current.value
            : null;

        // Make the stop date required is is stopping status selected
        if (isStopping && !stoppedAt) {
            toast(
                "Pour arrêter une inscription, veuillez renseigner une date d'arrêt.",
                {
                    autoClose: 3000,
                    type: "error",
                },
            );
            return Promise.resolve(false);
        }

        // Apply changes
        return this.updateApplication({
            activity_application_status_id: this.state.status_id,
            referent_id: this.state.referent_id,
            stopped_at: stoppedAt,
        });
    }

    handleUpdateBeginAt(begin_at) {
        // Avertissement si l'inscription est validée
        if (this.state.desiredActivities[0].is_validated && isValidDate(new Date(begin_at))) {
            const title = "<h5>Voulez-vous modifier la date d'inscription ?</h5>";
            const htmltext = "<p>La modification de la date d'inscription va entraîner une mise à jour des inscriptions aux séances du cours.</p>" +
                "<p>Le montant à régler pour l'élève risque donc d'être affecté.</p>";
            const confirmtext = "J'ai compris - modifier la date";

            swal.fire({
                title: title,
                html: htmltext,
                allowOutsideClick: true,
                showCancelButton: true,
                confirmButtonText: confirmtext,
                cancelButtonText: "<i class=\"fas fa-ban\"></i> annuler",
            }).then((res) => {
                if (res.value) {
                    this.updateApplication({ begin_at });
                } else {
                    this.setState({ begin_at: this.state.old_begin_at || this.state.begin_at });
                }
            });

            // Si l'inscription n'est pas validée, on peut librement modifier la date de début
        } else {
            this.updateApplication({ begin_at });
        }
    }

    updateApplication(updateObject) {
        this.handleAlertProposal();
        patch(`/inscriptions/${this.state.application.id}`, { application: updateObject })
            .then(({ data: app }) => this.setState({
                begin_at: app.begin_at,
                status: app.activity_application_status,
                status_updated_at: app.status_updated_at,
                referent: app.referent,
                referent_id: app.referent_id,
                stopped_at: app.stopped_at,
                old_begin_at: undefined,
            }));
    }

    handleSelectEvaluation(id) {
        this.setState({
            studentEvaluationId: parseInt(id) || "",
        });
    }

    handleSelectApplicationChangeQuestionnaire(id) {
        this.setState({
            applicationChangeQuestionnaireId: parseInt(id) || "",
        });
    }

    handleSelectNewStudentLevelQuestionnaire(id) {
        this.setState({
            newStudentLevelQuestionnaireId: parseInt(id) || "",
        });
    }

    handleAddSuggestions(id, suggestions) {
        return new Promise(res => {
            const suggs = this.state.suggestions;
            suggs[id] = suggestions;
            this.setState({ suggestions: suggs }, res);
        });
    }

    async handleSelectSuggestion(activityId, desiredActivityId, activityRefId) {
        const suggestions = this.state.suggestions[activityRefId];
        const desiredActivities = this.state.desiredActivities;

        const desiredActivity = {
            ..._.find(
                desiredActivities,
                da => da.id == desiredActivityId,
            ),
        };

        const response = await fetch(`/activity/${activityId}/desired/${desiredActivityId}`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });

        const { activity, error } = await response.json();

        const index = _.findIndex(
            suggestions,
            s => s.id == activity.id,
        );
        const indexDesired = _.findKey(
            desiredActivities,
            da => da.id == desiredActivity.id,
        );

        suggestions[index] = activity;

        if (!error) {
            desiredActivity.is_validated = true;
            desiredActivity.activity_id = activity.id;
        } else {
            swal({
                title: "Erreur",
                text: error,
                type: "error",
            });
        }

        desiredActivity.options = [];
        suggestions.forEach(s => {
            s.options = [];
        });

        this.setState({
            suggestions: {
                ...this.state.suggestions,
                [activityRefId]: suggestions,
            },
            desiredActivities: {
                ...this.state.desiredActivities,
                [indexDesired]: desiredActivity,
            },
        });
    }

    handleSelectSuggestionOption(activityId, desiredActivityId) {
        const desiredActivities = this.state.desiredActivities;

        fetch(`/activity/${activityId}/desired_option/${desiredActivityId}`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        })
            .then(response => response.json())
            .then(desiredActivity => {
                const indexDesired = _.findKey(
                    desiredActivities,
                    da => da.id == desiredActivity.id,
                );

                const suggestions = this.state.suggestions[
                    desiredActivity.activity_ref_id
                    ];

                // Update state's suggestions with new data
                _.forEach(desiredActivity.options, o => {
                    const index = _.findIndex(
                        suggestions,
                        s => s.id == o.activity_id,
                    );

                    // Check if option is not already here
                    if (!_.find(suggestions[index].options, o => o.desired_activity_id === desiredActivity.id))
                        suggestions[index].options = [
                            ...suggestions[index].options,
                            o,
                        ];
                });

                this.setState({
                    suggestions: {
                        ...this.state.suggestions,
                        [desiredActivity.activity_ref_id]: suggestions,
                    },
                    desiredActivities: {
                        ...this.state.desiredActivities,
                        [indexDesired]: desiredActivity,
                    },
                });
            });
    }

    handleRemoveSuggestionOption(suggestionId, desiredActivity) {
        const desiredActivities = this.state.desiredActivities;
        const suggestion = _.find(
            this.state.suggestions[desiredActivity.activity_ref_id],
            s => s.id == suggestionId,
        );

        fetch(
            `/activity/${suggestionId}/desired_option/${desiredActivity.id}`,
            {
                method: "DELETE",
                credentials: "same-origin",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            },
        )
            .then(response => response.json())
            .then(desiredActivity => {
                const indexDesired = _.findKey(
                    desiredActivities,
                    da => da.id == desiredActivity.id,
                );

                const actSuggestions = this.state.suggestions[
                    desiredActivity.activity_ref_id
                    ];
                const suggIndex = _.findIndex(
                    actSuggestions,
                    s => s.id == suggestion.id,
                );

                // Remove option from this suggestion
                actSuggestions[suggIndex].options = actSuggestions[suggIndex]
                    .options
                    .filter(o => o.desired_activity_id !== desiredActivity.id);

                this.setState({
                    suggestions: {
                        ...this.state.suggestions,
                        [desiredActivity.activity_ref_id]: actSuggestions,
                    },
                    desiredActivities: {
                        ...this.state.desiredActivities,
                        [indexDesired]: desiredActivity,
                    },
                });
            });
    }

    async handleRemoveStudent(activityId, desiredActivityId, activityRefId) {
        const suggestions = this.state.suggestions[activityRefId];
        const desiredActivities = this.state.desiredActivities;

        const desiredActivity = _.find(
            desiredActivities,
            da => da.id == desiredActivityId,
        );
        const response = await fetch(`/activity/${activityId}/desired/${desiredActivityId}`, {
            method: "DELETE",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });
        const activity = await response.json();

        const index = _.findIndex(
            suggestions,
            s => s.id == activity.id,
        );
        const indexDesired = _.findKey(
            desiredActivities,
            da => da.id == desiredActivity.id,
        );

        suggestions[index] = activity;

        desiredActivity.is_validated = false;
        desiredActivity.activity_id = null;

        this.setState({
            suggestions: {
                ...this.state.suggestions,
                [activityRefId]: suggestions,
            },
            desiredActivities: {
                ...this.state.desiredActivities,
                [indexDesired]: desiredActivity,
            },
        });
    }

    handleAddActivities() {
        fetch(`/inscriptions/${this.state.application.id}/add_activities`, {
            method: "PATCH",
            credentials: "same-origin",
            headers: {
                "x-csrf-token": csrfToken,
                "content-type": "application/json",
                accept: "application/json",
            },
            body: JSON.stringify({
                activity_ref_ids: this.state.addedSelectedActivities,
                additionalStudents: this.state.additionalStudents,
            }),
        })
            .then(response => response.json())
            .then(desired_activities => {
                this.setState({
                    desiredActivities: desired_activities,
                    addedSelectedActivities: [],
                    additionalStudents: [],
                });
            });
    }

    // handleRemoveActivity(activityRefId) {
    //     let newAddedSelectedActivities = [
    //         ...this.state.addedSelectedActivities,
    //     ];
    //     _.pullAt(
    //         newAddedSelectedActivities,
    //         _.indexOf(newAddedSelectedActivities, activityRefId)
    //     );

    //     let additionalStudents = [...this.state.additionalStudents];
    //     if (
    //         _.find(
    //             this.props.activityRefs,
    //             actRef => actRef.id == activityRefId
    //         ).has_additional_student
    //     ) {
    //         _.pullAt(
    //             additionalStudents,
    //             _.findIndex(
    //                 additionalStudents,
    //                 param => param[0] == activityRefId
    //             )
    //         );
    //     }

    //     this.setState({
    //         addedSelectedActivities: newAddedSelectedActivities,
    //         additionalStudents,
    //     });
    // }

    // handleAddActivity(activityRefId) {
    //     let newAddedSelectedActivities = [
    //         ...this.state.addedSelectedActivities,
    //     ];
    //     newAddedSelectedActivities = [
    //         ...newAddedSelectedActivities,
    //         activityRefId,
    //     ];
    //     let additionalStudents = [...this.state.additionalStudents];
    //     if (
    //         _.find(
    //             this.props.activityRefs,
    //             actRef => actRef.id == activityRefId
    //         ).has_additional_student
    //     ) {
    //         additionalStudents = [...additionalStudents, [activityRefId, null]];
    //     }

    //     this.setState({
    //         addedSelectedActivities: newAddedSelectedActivities,
    //         additionalStudents,
    //     });
    // }

    handleChangeAdditionalStudent(index, value) {
        const ind = parseInt(index);

        let additionalStudents = this.state.additionalStudents;

        additionalStudents[ind] = [additionalStudents[ind][0], value];

        this.setState({ additionalStudents });
    }

    handleRemoveDesiredActivity(id) {
        fetch(`/inscriptions/${this.state.application.id}/add_activity/${id}`, {
            method: "DELETE",
            credentials: "same-origin",
            headers: {
                "x-csrf-token": csrfToken,
                "content-type": "application/json",
                accept: "application/json",
            },
        })
            .then(response => response.json())
            .then(desired_activities => {
                this.setState({ desiredActivities: desired_activities });
            });
    }

    handleRemoveActivityApplication(e) {
        const isOneDesiredActivityValidated = Object.values(
            this.state.desiredActivities,
        ).reduce((acc, d) => acc || d.is_validated, false);

        if (isOneDesiredActivityValidated) {
            toast(
                "Les activités doivent toutes être retirées pour pouvoir supprimer cette demande",
                {
                    autoClose: 3000,
                    type: "warning",
                },
            );
        } else {

            let title = "<h5>Voulez-vous supprimer cette demande d'inscription ?</h5>";
            let htmltext = "<p>La demande de " + this.props.application.user.first_name + " " + this.props.application.user.last_name + " sera définitivement supprimé</p>";
            let confirmtext = "<i class=\"fas fa-trash\"></i> Supprimer la demande";
            swal.fire({
                title: title,
                html: htmltext,
                allowOutsideClick: true,
                showCancelButton: true,
                confirmButtonText: confirmtext,
                cancelButtonText: "<i class=\"fas fa-ban\"></i> annuler",
            }).then((res) => {
                if (res.value) {
                    fetch(`/destroy/activity_application/${this.state.application.id}`, {
                        method: "DELETE",
                        credentials: "same-origin",
                        headers: {
                            "x-csrf-token": csrfToken,
                            "content-type": "application/json",
                            accept: "application/json",
                        },
                    }).then(res => res.json()).then((data) => {
                        if (data.success) {
                            window.location.href = "/inscriptions";
                        } else {
                            swal.fire({
                                title: "Erreur",
                                html: data.message,
                                type: "error",
                            });
                        }
                    });
                }
            });

        }
    }

    sendConfirmationMail() {
        swal({
            title: "Envoi mail confirmation",
            text: "Êtes-vous sûr ?",
            type: "question",
            showCancelButton: true,
        }).then(v => {
            if (v.value) {
                this.setState({ sendingMail: true });

                fetch(
                    `/inscriptions/${this.state.application.id
                    }/send_confirmation_mail`,
                    {
                        method: "POST",
                        credentials: "same-origin",
                        headers: {
                            "x-csrf-token": csrfToken,
                            "content-type": "application/json",
                            accept: "application/json",
                        },
                        body: JSON.stringify({
                            application_status: parseInt(this.state.status_id),
                        }),
                    },
                ).then(() => {
                    this.setState({ mail_sent: true, sendingMail: false });
                });
            }
        });
    }

    // COMMENT HANDLERS
    handleCommentEdition(comment_id) {
        const comment = _.find(this.state.comments, c => c.id == comment_id);
        this.setState({ editedComment: comment });
    }

    handleUpdateNewCommentContent(e) {
        this.setState({ newComment: e.target.value });
    }

    handleUpdateEditedCommentContent(e) {
        this.setState({
            editedComment: {
                ...this.state.editedComment,
                content: e.target.value,
            },
        });
    }

    handleSaveComment() {
        fetch("/comments", {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                pragma: "no-cache",
                Accept: "application/json",
            },
            body: JSON.stringify({
                comment: {
                    user_id: this.props.user_id,
                    commentable_type: "ActivityApplication",
                    commentable_id: this.state.application.id,
                    content: this.state.newComment,
                },
            }),
        })
            .then(response => response.json())
            .then(comments =>
                this.setState({
                    comments,
                    newComment: "",
                }),
            );
    }

    handleSaveCommentEdition() {
        fetch(`/comments/${this.state.editedComment.id}`, {
            method: "PATCH",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                pragma: "no-cache",
                Accept: "application/json",
            },
            body: JSON.stringify({
                comment: this.state.editedComment,
            }),
        })
            .then(response => response.json())
            .then(comments => {
                this.setState({ comments, editedComment: null });
            });
    }

    handleChangeDesiredActivity(desiredId, activity_ref_id) {
        const oldDesiredIndex = Object.values(this.state.desiredActivities).findIndex(d => d.id === desiredId);

        swal({
            title: "Confirmation",
            text: "Êtes vous sûr.e de vouloir faire cela ?",
            type: "warning",
            showConfirmButton: true,
            showCancelButton: true,
        })
            .then(res => {
                if (oldDesiredIndex !== -1 && res.value) {
                    const newDesired = {
                        ...this.state.desiredActivities[oldDesiredIndex],
                        activity_ref_id,
                    };

                    fetch(`/desired_activities/${newDesired.id}`, {
                        method: "POST",
                        headers: {
                            "X-Csrf-Token": csrfToken,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            desired_activity: newDesired,
                        }),
                    })
                        .then(res => res.json())
                        .then(desired => {
                            const newDesiredActivities = Array.isArray(this.state.desiredActivities)
                                ? [...this.state.desiredActivities] : [...Object.values(this.state.desiredActivities)];

                            newDesiredActivities.splice(oldDesiredIndex, 1, desired);

                            this.setState({
                                desiredActivities: newDesiredActivities,
                            });
                        });
                }
            });

    }

    handleUpdateStudentLevel(level) {
        const newApplication = {
            ...this.state.application,
            user: {
                ...this.state.application.user,
                levels: [
                    ...this.state.application.user.levels,
                ],
            },
        };
        const { user: { levels } } = newApplication;

        const levelIndex = levels.findIndex(l => l.activity_ref_id === level.activity_ref_id && l.season_id === level.season_id);

        if (levelIndex === -1)
            levels.push(level);
        else
            levels.splice(levelIndex, 1, level);

        newApplication.user.levels = levels;

        this.setState({ application: newApplication });
    }

    handleDeleteStudentLevel(seasonId, activityRefId) {
        const application = {
            ...this.state.application,
            user: {
                ...this.state.application.user,
                levels: this
                    .state
                    .application
                    .user
                    .levels
                    .filter(l =>
                        l.season_id !== seasonId &&
                        l.activity_ref_id !== activityRefId,
                    ),
            },
        };

        this.setState({ application });
    }

    handleUpdateSuggestion(suggestion) {
        const desiredActivities = [...this.state.desiredActivities];

        const desiredIdx = desiredActivities.findIndex(da => da.activity_ref.activity_ref_kind_id === suggestion.activity_ref.activity_ref_kind_id);
        const desiredActivity = { ...desiredActivities[desiredIdx] };

        const suggestions = _.mapValues(
            this.state.suggestions,
            s => s.map(a => a.id === suggestion.id ? suggestion : a),
        );

        const isUserInSuggestion = _.some(suggestion.users, u => u.id === this.state.application.user_id);
        const isUserAssignedToSuggestion = desiredActivity.activity_id === suggestion.id;

        // Validate desired_activity if current user is in activity
        if (isUserInSuggestion) {
            desiredActivity.activity_id = suggestion.id;
            desiredActivity.is_validated = true;
        }
        // Else invalidate if was previously validated
        else if (isUserAssignedToSuggestion)
            desiredActivity.activity_id = null;

        const isUserInSuggestionOptions = _.some(suggestion.options, o => o.desired_activity_id === desiredActivity.id);
        const optionAlreadyRegistered = _.some(desiredActivity.options, o => o.activity_id === suggestion.id);

        // Add an option to desired_activity if current user is in activity's options
        if (isUserInSuggestionOptions)
            !optionAlreadyRegistered && desiredActivity.options.push({
                desired_activity_id: desiredActivity.id,
                activity_id: suggestion.id,
            });
        // Remove it otherwise
        else
            desiredActivity.options = desiredActivity.options.filter(o => o.activity_id !== suggestion.id);

        desiredActivities.splice(desiredIdx, 1, desiredActivity);

        const newState = {
            suggestions,
            desiredActivities,
        };

        this.setState(newState);

        return newState;
    }

    handleAlertProposal() {
        if (this.state.status_id == ActivityApplicationStatus.PROPOSAL_REFUSED_ID) {
            this.state.alertProposal = <div className={"alert alert-danger"}>
                <h4><i className="fa fa-exclamation-triangle" aria-hidden="true" /><strong className={"ml-2"}>Proposition
                    refusée</strong></h4>
                <strong>Raison du refus : </strong><span>{this.props.application.reason_of_refusal}</span>
            </div>;
        } else if (this.state.status_id == ActivityApplicationStatus.PROPOSAL_ACCEPTED_ID) {
            this.state.alertProposal = <div className={"alert alert-success"}>
                <p><i className="fa fa-check" aria-hidden="true" /><strong className={"ml-2"}>Proposition
                    Acceptée</strong></p>
            </div>;
        } else {
            this.state.alertProposal = "";
        }
    }

    render() {
        const {
            activityRefs,
            isAdmin,
            statuses,
            levels,
        } = this.props;

        const { application } = this.state;

        // Pourquoi je fais ça comme ça ?
        let activity_refs_idx = {};
        _.map(this.props.activityRefs, ar => (activity_refs_idx[ar.id] = ar));

        const self = this;

        const getNonValidatedSuggestions = (daId, suggestions) =>
            _.filter(suggestions, s =>
                _.filter(
                    this.state.desiredActivities,
                    da =>
                        da.id !== daId &&
                        da.is_validated &&
                        s.activity_ref_id === da.activity_ref_id &&
                        s.id === da.activity_id,
                ).length === 0,
            );

        const suggestions = _.reduce(
            this.state.desiredActivities,
            (acc, da) => {
                const val =
                    _.uniq(
                        _.map(
                            self.state.desiredActivities,
                            da => da.activity_ref_id,
                        ),
                    ).length !== _.size(self.state.desiredActivities)
                        ? getNonValidatedSuggestions(
                            da.id,
                            self.state.suggestions[da.activity_ref_id],
                        )
                        : self.state.suggestions[da.activity_ref_id];

                return { ...acc, [da.id]: val };
            },
            {},
        );

        const evaluationAppointments = application
            .evaluation_appointments
            .map(app => ({
                refId: app.activity_ref_id,
                teacher: app.teacher,
                timeInterval: app.time_interval,
            }));

        const activitiesDisplay = _.chain(this.state.desiredActivities)
            .sortBy(da => da.activity_ref_id)
            .map(da => {
                const detectedEvaluation = this.props
                    .student_evaluations
                    .forms
                    .map(e => e.form)
                    .find(e => e.season_id === this.state.application.season_id &&
                        e.activity.activity_ref_id === da.activity_ref_id);

                return (
                    <Activity
                        key={da.activity_ref_id}
                        desiredActivity={da}
                        activityRef={activity_refs_idx[da.activity_ref_id]}
                        activityRefs={this.props.activityRefs}
                        seasons={this.props.seasons}
                        evaluationLevelRefs={this.props.evaluation_level_refs}
                        //Let child component keep track of begin_at changes
                        //To reload suggestions
                        application={{
                            ...application,
                            begin_at: this.state.begin_at,
                            stopped_at: this.state.stopped_at,
                        }}
                        suggestions={suggestions[da.id]}
                        desiredActivities={this.state.desiredActivities}
                        isAdmin={isAdmin}
                        userId={this.props.application.user.id}
                        levels={self.props.levels}
                        studentEvaluationQuestions={this.props.student_evaluation_questions}
                        instruments={this.props.application.user.instruments ? this.props.application.user.instruments : null}
                        detectedEvaluation={detectedEvaluation}
                        handleAddSuggestions={(id, s) =>
                            this.handleAddSuggestions(id, s)
                        }
                        handleUpdateSuggestion={s => this.handleUpdateSuggestion(s)}
                        handleSelectSuggestion={(
                            activityId,
                            desiredActivityId,
                            activityRefId,
                        ) =>
                            this.handleSelectSuggestion(
                                activityId,
                                desiredActivityId,
                                activityRefId,
                            )
                        }
                        handleUpdateStudentLevel={l => this.handleUpdateStudentLevel(l)}
                        handleDeleteStudentLevel={(s, a) => this.handleDeleteStudentLevel(s, a)}
                        handleRemoveStudent={(
                            activity_id,
                            desired_activity_id,
                            activityRefId,
                        ) =>
                            this.handleRemoveStudent(
                                activity_id,
                                desired_activity_id,
                                activityRefId,
                            )
                        }
                        handleRemoveDesiredActivity={id =>
                            this.handleRemoveDesiredActivity(id)
                        }
                        isAlreadyBusy={ti => this.isAlreadyBusy(ti)}
                        handleSelectSuggestionOption={(
                            activityId,
                            desiredActivityId,
                        ) =>
                            this.handleSelectSuggestionOption(
                                activityId,
                                desiredActivityId,
                            )
                        }
                        handleRemoveSuggestionOption={(
                            activityId,
                            desiredActivityId,
                        ) =>
                            this.handleRemoveSuggestionOption(
                                activityId,
                                desiredActivityId,
                            )
                        }
                        handleChangeDesiredActivity={
                            (desiredId, refId) => this.handleChangeDesiredActivity(desiredId, refId)
                        }
                    />
                );
            })
            .value();

        // Status handling
        const generateStatusSelection = _(statuses)
            .filter(s => s.is_active)
            .map((s, i) => {
                return (
                    <div key={i} className="radio radio-primary">
                        <input
                            type="radio"
                            name="status"
                            value={s.id}
                            disabled={(s.id === ActivityApplicationStatus.ACTIVITY_PROPOSED_ID ||
                                    s.id === ActivityApplicationStatus.ACTIVITY_ATTRIBUTED_ID) &&
                                !_.reduce(this.state.desiredActivities, (acc, d) => acc && d.is_validated, true,
                                )}
                            checked={this.state.status_id == s.id}
                            onChange={e => {
                                this.handleChangeStatus(e);
                            }}
                            id={s.id}
                        />
                        <label htmlFor={s.id}>
                            <span>{s.label}</span>
                        </label>
                    </div>
                );
            })
            .value();

        const isStopping = findAndGet(
            this.props.statuses,
            (s) => parseInt(s.id, 10) === parseInt(this.state.status_id, 10),
            "is_stopping",
        );


        //-- end status handling

        const desiredActivitiesValidatedCount = _.filter(
            this.state.desiredActivities,
            da => da.is_validated,
        ).length;

        const paymentLink = this.props.payer
            ? `/payments/summary/${this.props.payer.id}`
            : null;

        const adhesionNumber =
            application.user.adherent_number != null
                ? application.user.adherent_number
                : "";

        const availabilities =
            Summary.filterTimeIntervals(application.user.planning.time_intervals, application.season)
                .orderBy(ti => ti.start)
                .map(
                    int =>
                        `${moment(int.start).format("dddd")} : ${moment(
                            int.start,
                        ).format("HH:mm")} - ${moment(int.end).format("HH:mm")}`,
                )
                .uniq()
                .map((tag, i) => <p key={i}>{tag}</p>)
                .value();

        let otherApplications = (
            <p className="m-b-xl">
                <i>Aucune autre demande en cours pour cet utilisateur</i>
            </p>
        );

        if (this.state.application.user.activity_applications) {
            let applications = _.filter(
                this.state.application.user.activity_applications,
                aa =>
                    aa.season_id === this.state.application.season_id &&
                    aa.id !== this.state.application.id,
            );

            otherApplications = _.map(applications, (a, i) => {
                const activityRef = _.head(a.desired_activities).activity_ref;
                let actionLabel = "Nouvelle demande";
                if (a.pre_application_activity) {
                    actionLabel = PRE_APPLICATION_ACTION_LABELS[a.pre_application_activity.action];
                } else if (a.pre_application_desired_activity) {
                    actionLabel = PRE_APPLICATION_ACTION_LABELS[a.pre_application_desired_activity.action];
                }

                return <a
                    href={`/inscriptions/${a.id}`}
                    key={i}
                    className="ibox-title">
                    <h5>
                        {activityRef.activity_type == "child"
                            ? activityRef.label
                            : activityRef.kind}
                        <span className="badge badge-warning m-l-sm">
                            {actionLabel}
                        </span>
                    </h5>

                    <div className="ibox-tools">
                        <label className="m-r-sm">Statut</label>
                        <span className="custom-select">
                            {a.activity_application_status.label}
                        </span>
                    </div>
                </a>;
            });
        }

        return (
            <React.Fragment>
                <div className="wrapper wrapper-content">
                    {/* HEADER */}
                    <div className="flex flex-space-between-justified m-b-sm">
                        <div className="flex flex-center-aligned">
                            <h2 className="no-margins">
                                <UserWithInfos userId={application.user.id}>
                                    {application.user.first_name}{" "}
                                    <b>{application.user.last_name}</b>
                                    <i className="fas fa-info-circle m-l-sm" />
                                </UserWithInfos>
                                , {moment().diff(application.user.birthday, "years")} ans
                                <small> - Adhérent n°{adhesionNumber}</small>
                            </h2>

                            <div className="vertical-hr md" />

                            <ButtonModal
                                modalProps={{ style: { content: { position: "static" } } }}
                                count={otherApplications.length}
                                label="Autres demandes"
                                className="btn btn-primary count-button">
                                <h2 className="m-t-md m-b-sm">Autres demandes</h2>

                                <div className="ibox activity-application">
                                    {otherApplications.length > 0 ?
                                        otherApplications :
                                        <h4>Aucune autre demande.</h4>}
                                </div>
                            </ButtonModal>
                        </div>

                        <div className="flex flex-center-aligned">
                            <div className="flex m-r-sm flex-center-aligned">
                                <label className="m-r-xs" style={{ flex: "1" }}>Référent.e</label>
                                <select
                                    style={{ flex: "3" }}
                                    className="custom-select"
                                    value={this.state.referent_id || ""}
                                    onChange={e => this.updateApplication({ referent_id: parseInt(e.target.value) })}>
                                    <option value="">SELECTIONNER UN REFERENT</option>
                                    {_.sortBy(this.props.admins, "first_name").map(optionMapper({
                                        label: u => `${u.first_name} ${u.last_name}`,
                                    }))}
                                </select>
                            </div>
                            <div className="flex flex-column">
                                <div className="flex flex-center-aligned">
                                    <label className="m-r-xs">Statut</label>
                                    <button
                                        style={{ flex: "none" }}
                                        className="custom-select flex flex-space-between-justified"
                                        data-toggle="modal"
                                        data-target="#statusModal">
                                        <div>{this.state.status.label}</div>

                                        <span className="custom-select-arrow">›</span>
                                    </button>
                                </div>
                                {application.status_updated_at ?
                                    <small>
                                        <i>
                                            Modifié {moment(this.state.status_updated_at).fromNow()}
                                            {this.state.referent && ` - ${this.state.referent.first_name && this.state.referent.first_name.charAt(0)}. ${this.state.referent.last_name}` || ""}
                                        </i>
                                    </small> : null}
                            </div>
                        </div>
                    </div>

                    {this.state.alertProposal}

                    {/* ACTIONS */}
                    <div className="flex flex-space-between-justified">
                        <div className="flex flex-center-aligned">
                            <a
                                href={"/users/" + application.user.id}
                                data-tippy-content="Voir la fiche"
                                className="btn btn-primary m-r-sm">
                                <i className="fas fa-user" />
                            </a>
                            {Boolean(this.props.payer) &&
                                <a
                                    href={paymentLink}
                                    data-tippy-content="Règlements"
                                    className="btn btn-primary m-r-sm">
                                    <i className="fas fa-euro-sign" />{" "}
                                </a>}
                            <button
                                onClick={() => this.sendConfirmationMail()}
                                className="btn btn-primary"
                                data-tippy-content="Envoyer mail confirmation"
                                disabled={this.state.sendingMail || !_.reduce(this.state.desiredActivities, (acc, des) => acc || des.is_validated, false)}>
                                <i className="fas fa-envelope" />

                            </button>
                            <small className="m-l-sm m-r">
                                <i>
                                    {this.state.mail_sent
                                        ? "Mail envoyé"
                                        : "Pas envoyé"}
                                </i>
                            </small>
                            <div style={{ minWidth: "175px" }} className="flex-column m-r-md">
                                <div className="form-group">
                                    <label htmlFor="begin_at">
                                        {"Début le"}
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="begin_at"
                                        value={moment(this.state.begin_at).format(ISO_DATE_FORMAT)}
                                        onKeyDown={(e) => {
                                            this.useDateChangedTimeout = true;
                                        }}
                                        onChange={(e) => {
                                            if (this.changeDateTimeout) {
                                                clearTimeout(this.changeDateTimeout);
                                            }

                                            const value = e.target.value;

                                            this.changeDateTimeout = setTimeout(() => {
                                                this.handleUpdateBeginAt(value);
                                            }, this.useDateChangedTimeout ? 1000 : 100);

                                            this.setState({
                                                begin_at: value,
                                                old_begin_at: (this.state.old_begin_at || this.state.begin_at),
                                            });
                                        }}
                                        min={moment(this.state.application.season.start).format(ISO_DATE_FORMAT)}
                                        max={moment(this.state.stopped_at || this.state.application.season.end).format(ISO_DATE_FORMAT)} />
                                </div>
                            </div>

                            {this.state.stopped_at && this.stopped_at !== "" ?
                                <div style={{ minWidth: "175px" }} className="flex-column">
                                    <div className="form-group">
                                        <label htmlFor="stop_date">{"Arrêt le"}</label>
                                        <input
                                            className="form-control"
                                            disabled
                                            type="date"
                                            value={this.state.stopped_at && moment(this.state.stopped_at).format("YYYY-MM-DD") || ""}
                                        />
                                    </div>
                                </div>
                                : null}
                        </div>

                        <div className="flex flex-center-aligned">
                            {/* CHANGE QUESTIONNAIRE */}
                            <ButtonModal
                                modalProps={{ style: { content: { position: "static" } } }}
                                className="btn btn-primary m-r-sm count-button"
                                tooltip="Questionnaire changement"
                                label={<i className="fas fa-question-circle" />}
                                count={this.props.application_change_questionnaires.forms.length}
                                disabled={this.props.application_change_questionnaires.forms.length === 0}>
                                <div className="ibox">
                                    <div className="ibox-title">
                                        <h4>Questionnaire sur le changement</h4>
                                        <select
                                            className="form-control"
                                            onChange={e => this.handleSelectApplicationChangeQuestionnaire(e.target.value)}
                                            defaultValue={this.state.applicationChangeQuestionnaireId}>
                                            <option value="">Sélectionnez un questionnaire</option>
                                            {
                                                this.props
                                                    .application_change_questionnaires
                                                    .forms
                                                    .map(e => e.form)
                                                    .map(optionMapper({
                                                        label: e => `Cours ${findAndGet(this.props.activityRefs, r => r.id === e.activity.activity_reéf_id, "label")} dans ${e.activity.group_name} avec ${e.activity.teacher.first_name} ${e.activity.teacher.last_name}`,
                                                    }))
                                            }
                                        </select>
                                    </div>
                                    {
                                        !!this.state.applicationChangeQuestionnaireId &&
                                        <div className="ibox-content">
                                            {renderEvaluationForm(
                                                this.props.application_change_questionnaires,
                                                this.props.application_change_questions,
                                                this.state.applicationChangeQuestionnaireId,
                                            )}
                                        </div>
                                    }
                                </div>
                            </ButtonModal>

                            {/* AUTO-EVALUATIONS */}
                            <ButtonModal
                                modalProps={{ style: { content: { position: "static" } } }}
                                disabled={this.props.new_student_level_questionnaires.length === 0}
                                count={this.props.new_student_level_questionnaires.length}
                                className="btn btn-primary count-button m-r-sm"
                                tooltip="Auto-évaluation de niveau"
                                label={<i className="fas fa-user-check" />}>
                                <div className="ibox">
                                    <div className="ibox-title">
                                        <h4>Auto-évaluation de niveau</h4>
                                        <select
                                            className="form-control"
                                            onChange={e => this.handleSelectNewStudentLevelQuestionnaire(e.target.value)}
                                            defaultValue={this.state.applicationChangeQuestionnaireId}>
                                            <option value="">Sélectionnez un questionnaire</option>
                                            {
                                                this.props
                                                    .new_student_level_questionnaires
                                                    .map(optionMapper({
                                                        label: e => `Activité ${e.activity_ref.kind}`,
                                                    }))
                                            }
                                        </select>
                                    </div>
                                    {
                                        !!this.state.newStudentLevelQuestionnaireId &&
                                        <div className="ibox-content">
                                            <EvaluationForm
                                                questions={this.props.new_student_level_questions}
                                                answers={
                                                    getAnswersObject(
                                                        findAndGet(
                                                            this.props.new_student_level_questionnaires,
                                                            { id: this.state.newStudentLevelQuestionnaireId },
                                                            "answers",
                                                        ),
                                                    )
                                                }
                                                readOnly />
                                        </div>
                                    }
                                </div>
                            </ButtonModal>

                            {/* EVALUATIONS */}
                            <ButtonModal
                                tooltip="Évaluation"
                                className="btn count-button btn-primary"
                                count={this.props.student_evaluations.forms.length}
                                disabled={this.props.student_evaluations.forms.length === 0}
                                modalProps={{ style: { content: { position: "static" } } }}
                                label={<span className="fa-layers">
                                    <i className="fas fa-chalkboard-teacher" />
                                    <i className="fas fa-check" data-fa-transform="shrink-9 right-4.5 up-2.5" />
                                </span>}>
                                <div className="ibox">
                                    <div className="ibox-title">
                                        <h4>Évaluations de l'élève</h4>
                                        <select
                                            className="form-control"
                                            onChange={e => this.handleSelectEvaluation(e.target.value)}
                                            defaultValue={this.state.studentEvaluationId}>
                                            <option value="">Sélectionnez une évaluation</option>
                                            {
                                                this.props
                                                    .student_evaluations
                                                    .forms
                                                    .map(e => e.form)
                                                    .map(optionMapper({
                                                        label: e => `Pour ${e.season.label}, cours ${findAndGet(this.props.activityRefs, r => r.id === e.activity.activity_ref_id, "label")} dans ${e.activity.group_name} avec ${e.teacher.first_name} ${e.teacher.last_name}`,
                                                    }))
                                            }
                                        </select>
                                    </div>
                                    {
                                        !!this.state.studentEvaluationId &&
                                        <div className="ibox-content">
                                            {renderEvaluationForm(
                                                this.props.student_evaluations,
                                                this.props.student_evaluation_questions,
                                                this.state.studentEvaluationId,
                                            )}
                                        </div>
                                    }
                                </div>
                            </ButtonModal>

                            <div className="vertical-hr" />

                            {/* CRENEAUX EVAL */}
                            <ButtonModal
                                modalProps={{ style: { content: { position: "static" } } }}
                                label={<i className="fas fa-calendar-check" />}
                                className="btn btn-primary count-button m-r-sm"
                                tooltip="Créneau d'évaluation"
                                disabled={_.size(application.evaluation_appointments) === 0}>
                                <EvaluationChoice
                                    noIntervalMessage="Pas de créneau"
                                    showChoiceNumber={false}
                                    activityRefs={this.props.activityRefs}
                                    data={evaluationAppointments} />
                            </ButtonModal>

                            {/* DISPOS. */}
                            <ButtonModal
                                modalProps={{ style: { content: { position: "static" } } }}
                                count={availabilities.length}
                                label={<i className="fas fa-clock" />}
                                className="btn btn-primary count-button m-r-sm"
                                tooltip="Disponibilités horaires">
                                <div className="ibox">
                                    <div className="ibox-title">
                                        <h4>Disponibilités horaires</h4>
                                    </div>
                                    <div className="ibox-content">
                                        {this.props.canEditAvailabilities ?
                                            <TimePreferencesStep
                                                selectionLabels={[_.head(this.state.application.activity_refs).display_name]}
                                                mode={PLANNING_MODE}
                                                planningId={this.props.application.user.planning.id}
                                                intervals={this.props.application.user.planning.time_intervals}
                                                season={this.state.application.season}
                                                seasons={this.props.seasons}
                                                childhoodPreferences={null}
                                                activityRefs={this.state.application.activity_refs}
                                                authToken={null}
                                                handleUpdateChildhoodPreferences={null}
                                            />
                                            :
                                            availabilities
                                        }
                                    </div>
                                </div>
                            </ButtonModal>

                            {/* INFOS SUPP. */}
                            <ButtonModal
                                modalProps={{ style: { content: { position: "static" } } }}
                                label={<i className="fas fa-info-circle" />}
                                count={application.user
                                    .handicap_description ? 1 : 0}
                                className="btn btn-primary count-button m-r-sm"
                                tooltip="Infos complémentaires">
                                <div className="ibox">
                                    <div className="ibox-title">
                                        <h4>Infos complémentaires</h4>
                                    </div>
                                    <div className="ibox-content">
                                        {application.user.handicap_description != undefined && application.user
                                            .handicap_description.length > 0
                                            ? <div><p><b>Infos:</b> {application.user
                                                .handicap_description}</p>
                                                <hr />
                                            </div>
                                            : ""}
                                    </div>
                                </div>
                            </ButtonModal>

                            {/* COMMENTAIRES */}
                            <ButtonModal
                                modalProps={{ style: { content: { position: "static" } } }}
                                count={this.state.comments.length}
                                label={<i className="fas fa-comment" />}
                                className="btn btn-primary count-button m-r-sm"
                                tooltip="Commentaires">
                                <CommentSection
                                    comments={this.state.comments}
                                    userId={this.props.user_id}
                                    contextType="ActivityApplication"
                                    contextId={this.state.application.id}
                                    newComment={this.state.newComment}
                                    editedComment={this.state.editedComment}
                                    handleUpdateNewCommentContent={e => this.handleUpdateNewCommentContent(e)}
                                    handleSaveComment={() => this.handleSaveComment()}
                                    handleUpdateEditedCommentContent={e => this.handleUpdateEditedCommentContent(e)}
                                    handleSaveCommentEdition={() => this.handleSaveCommentEdition()}
                                    handleCommentEdition={id => this.handleCommentEdition(id)} />
                            </ButtonModal>

                            {/* SUPPRESSION */}
                            <button
                                type="button"
                                className="btn btn-md btn-warning"
                                data-tippy-content="Supprimer définitivement cette demande"
                                onClick={e =>
                                    this.handleRemoveActivityApplication(e)
                                }>
                                <i className="fas fa-trash" />
                            </button>
                        </div>

                        {isAdmin ? (
                            <div
                                className="modal inmodal"
                                id="statusModal"
                                tabIndex="-1"
                                role="dialog"
                                aria-hidden="true"
                            >
                                <div className="modal-dialog">
                                    <div className="modal-content animated">
                                        <div className="modal-header">
                                            <p>Statut de la demande</p>
                                        </div>
                                        <div className="modal-body">
                                            {generateStatusSelection}

                                            {isStopping ?
                                                (
                                                    <div className="form-group">
                                                        <label>Date d'arrêt de l'activité</label>
                                                        <input
                                                            className={`form-control ${!this.state.stoppedAt ? "invalid" : ""}`}
                                                            type="date"
                                                            name="stop_date"
                                                            ref={this.stopDateInput}
                                                            defaultValue={this.state.stopped_at && moment(this.state.stopped_at).format("YYYY-MM-DD") || ""}
                                                            min={moment(this.state.begin_at).format(ISO_DATE_FORMAT)}
                                                            max={moment(this.state.application.season.end).format(ISO_DATE_FORMAT)}
                                                        />
                                                    </div>
                                                )
                                                : null}
                                        </div>
                                        <div className="modal-footer flex flex-space-between-justified">
                                            <button className="btn" style={{ marginRight: "auto" }} type="button"
                                                    data-dismiss="modal">
                                                <i className="fas fa-times m-r-sm" />
                                                Annuler
                                            </button>

                                            <button
                                                className="btn btn-primary"
                                                data-dismiss="modal"
                                                onClick={() =>
                                                    this.handleSaveStatus()
                                                }>
                                                <i className="fas fa-check m-r-sm" />
                                                Valider
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {activitiesDisplay}
                </div>
            </React.Fragment>
        );
    }

    static filterTimeIntervals(time_intervals, season) {
        return _.chain(time_intervals)
            .filter(ti => {
                    return ti.kind === "p" &&
                        moment(ti.start).isBetween(
                            moment(season.start).startOf("week"),
                            moment(season.end),
                        );
                },
            );
    }
}

function renderEvaluationForm(forms, questions, formId) {
    const form = forms
        .forms
        .find(e => e.form.id === formId);

    if (form) {
        const answers = getAnswersObject(form.form.answers);

        return <EvaluationForm
            readOnly
            questions={questions}
            referenceData={{
                ...forms.common_reference_data,
                ...form.contextual_reference_data,
            }}
            answers={answers} />;
    } else
        return <h4>Echec du rendu : cette évaluation n'existe pas</h4>;
}

export default Summary;
