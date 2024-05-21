import React, {Fragment} from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import fetch from "isomorphic-unfetch";

import {toast} from "react-toastify";
import * as api from "../../tools/api";

const moment = require("moment-timezone");
require("moment/locale/fr");

import ActivityDetailsModal from "./ActivityDetailsModal.js";
import SelectActivity from "./SelectActivity";

import CustomCalendar from "./Calendar.js";
import Modal from "react-modal";
import RawPlanning from "./RawPlanning.js";

import Select from "react-select";

import * as TimeIntervalHelpers from "./TimeIntervalHelpers.js";
import MultiViewModal from "./MultiViewModal.js";
import {csrfToken} from "../utils";
import EvaluationModal from "./EvaluationModal";
import CreateIntervalModal from "./CreateActivityModal.js";
import RoomActivitiesListModal from "./RoomActivitiesListModal";

const idGenerator = (function* () {
    let i = 1;
    while (true) yield i++;
})();

const propTypes = {
    isTeacher: PropTypes.bool,
    displayOnly: PropTypes.bool.isRequired,
    planningId: PropTypes.number,
    updateTimePreferences: PropTypes.func,
};

class Planning extends React.Component {
    abortController;
    fetchOngoing;

    constructor(props) {
        super(props);

        let day = this.props.day
            ? typeof this.props.day === "string" ? new Date(this.props.day) : this.props.day
            : new Date();

        // if (this.props.generic) day = moment().startOf("week");

        this.abortController = null;
        this.fetchOngoing = false;

        const type =
            (this.props.planning && this.props.planning.id && "planning") ||
            "room";

        this.state = {
            day,
            view: "week",
            type,
            ...this.getIntervals(this.props.intervals || []),
            isCreationModalOpen: false,
            isDetailModalOpen: false,
            newInterval: {},
            selectedSchedule: undefined,
            lastReinitialize: null,
            selectedPlannings: [
                type === "planning"
                    ? _.get(this.props, "planning.id")
                    : _.get(this.props, "room.id"),
            ],
            intervalDetail: null,
            conflicts: this.props.planning ? this.props.planning.conflicts : [],
            errors: [],
            isMultiViewModalOpen: false,
            isEvaluationModalOpen: false,
            savingActivityInstances: false,
            showAlert: this.props.season.holidays.length === 0,
        };

        this.updateTargets = this.updateTargets.bind(this);
    }

    componentDidMount() {
        if (!this.props.generic)
            this.updateIntervals(this.state.day, this.state.view);
    }

    fetchIntervals() {
        /* abort current fetch request
           to avoid the case where its response
           would arrive earlier than the one
           of the fetch request we're about to do */
        if (this.fetchOngoing) this.abortController.abort();

        /* Creates a new abort controller and
           flags the component as having an
           ongoing fetch request, so that
           it can be aborted if another request comes
           in the mean time */
        this.abortController = new AbortController();
        this.fetchOngoing = true;

        this.setState({loading: true});

        const intervalsPromises = this.state.selectedPlannings.map((id) => {
            return TimeIntervalHelpers.fetchIntervals(
                csrfToken,
                id,
                this.state.type,
                this.state.day,
                this.state.view,
                this.abortController.signal
            ).then(data => {
                const intervals = this.props.planningOwners
                    ? data.intervals.map(int => ({...int, owner_id: this.props.planningOwners[id]}))
                    : data.intervals;

                if (!this.props.generic) {
                    let holidays = TimeIntervalHelpers.formatHolidays(
                        data.holidays
                    );
                    intervals.push(holidays);
                }

                return _.flatten(intervals);
            });
        });

        Promise.all(intervalsPromises)
            .then(responses => {
                //unflags the component, the request is over
                this.fetchOngoing = false;

                const intervals = _(responses)
                    .flatten()
                    .uniqBy("id")
                    .value();

                this.setState({
                    ...this.getIntervals(intervals),
                    loading: false,
                });
            })
            .catch(e => {
                if (e.name !== "AbortError")
                    toast.error("Erreur lors du rapatriement des données", {
                        autoClose: 3000,
                        position: toast.POSITION.BOTTOM_CENTER,
                    });

                return [];
            });
    }

    updateIntervals(day, view) {
        this.setState({day, view}, () => this.fetchIntervals());
    }

    updateTargets(targets) {
        if (targets.length) {
            //const selectedPlannings = targets.map(t => t.value);
            this.setState(
                {
                    selectedPlannings: targets,
                },
                () => this.fetchIntervals()
            );
        }
    }

    getIntervals(intervals) {
        return {
            // For the moment we keep the old array of intervals, to not break anything
            selectedIntervals: intervals,

            // We're gonna need a store, where we index the intervals by id, for easier work
            // and a selector to list them and transform them to pass to the calendar
            intervalStore: TimeIntervalHelpers.indexById(intervals),
        };
    }

    commitIntervals(intervals, seasonId) {
        // After most handlers, we save the current intervals "state" to server

        let planningId;
        if (this.props.planning) {
            planningId = this.props.planning.id;
        } else {
            planningId = _.head(this.props.plannings).id;
        }

        return fetch(`/planning/${planningId}`, {
            method: "PATCH",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                intervals: TimeIntervalHelpers.momentify(intervals),
                conflictId: this.props.conflict ? this.props.conflict.id : null,
                seasonId,
            }),
        })
            .then(response => response.json())
            .then(results => {
                let {intervals} = results;

                const intervalStore = TimeIntervalHelpers.indexById(
                    intervals,
                    this.state.intervalStore
                );

                this.setState({
                    selectedIntervals: _.values(intervalStore),
                    intervalStore,
                    conflicts: _.compact([
                        ...(this.state.conflicts || []),
                        ...results.conflicts,
                    ]),
                });

                return results;
            });
    }

    // ====================================
    // HANDLERS FOR STUDENT MANAGEMENT
    // ====================================
    handleRemoveStudent(activity, student) {
        const desiredActivityId = _.chain(
            student.activity_application.desired_activities
        )
            .filter(da => da.activity_id === activity.id)
            .map(da => da.id)
            .value()[0];

        fetch(`/activity/${activity.id}/desired/${desiredActivityId}`, {
            method: "DELETE",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        })
            .then(response => response.json())
            .then(activity => {
                const interval = activity.time_interval;
                // let [int] = TimeIntervalHelpers.momentify([interval]);
                int.activity = activity;

                const {selectedIntervals} = this.state;
                const index = this.state.selectedIntervals.findIndex(i => {
                    return i.id === interval.id;
                });

                if (index > -1) {
                    selectedIntervals[index] = int;
                    this.setState({selectedIntervals});
                }
            });
    }

    handleRemoveOptionalStudent(activity, optionalStudent) {
        const desiredActivityId = optionalStudent.desired_activity_id;

        fetch(`/activity/${activity.id}/desired_option/${desiredActivityId}`, {
            method: "DELETE",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        })
            .then(response => response.json())
            .then(activity => {
                const interval = activity.time_interval;
                // let [int] = TimeIntervalHelpers.momentify([interval]);
                int.activity = activity;

                const {selectedIntervals} = this.state;
                const index = this.state.selectedIntervals.findIndex(i => {
                    return i.id === interval.id;
                });

                if (index > -1) {
                    selectedIntervals[index] = int;
                    this.setState({selectedIntervals});
                }
            });
    }

    // ======================================
    // HANDLERS FOR CALENDAR
    // ======================================
    // Availability Time Interval
    handleCreateInterval(newInterval, seasonId) {
        // We can only now select only one interval
        //const { selectedIntervals } = this.state;

        let newIntervals = [newInterval];
        // if (this.props.user && this.props.user.is_teacher) {
        //     newIntervals = TimeIntervalHelpers.cutInterval(newInterval);
        // }

        //const { intervalStore } = this.state;
        const intervals = newIntervals.map((interval) => ({
            start: moment.isMoment(interval.start)
                ? interval.start.toISOString()
                : interval.start,
            end: moment.isMoment(interval.end)
                ? interval.end.toISOString()
                : interval.end,
            kind: interval.kind || "p",
            uid: idGenerator.next().value,
        }));

        if (this.props.updateTimePreferences) {
            //On flagge cet intervalle comme nouveau
            //pour éviter les colisions
            newIntervals = newIntervals.map(i => ({
                ...i,
                isNew: true,
            }));
            let formattedIntervals = TimeIntervalHelpers.momentify(
                newIntervals
            );
            let allIntervals = [...this.props.intervals, ...formattedIntervals];
            //L'indexage donne des faux ids, flaggage au dessus pour éviter colisions
            const intervalStore = TimeIntervalHelpers.indexById(
                allIntervals,
                this.state.intervalStore
            );

            this.props.updateTimePreferences(_.values(intervalStore));
            return this.setState({
                intervalStore,
            });
        } else {
            this.commitIntervals(intervals, seasonId).then(results => {
                if (results.intervals.length === 1 && this.props.isTeacher) {
                    this.handleOpenDetail(results.intervals[0]);
                }
            })
        }
    }

    handleCreateActivityInstances(
        availabilityIntervalId,
        activity,
        activityInstances,
    ) {
        // Reinit errors before fetching
        this.setState({errors: [], savingActivityInstances: true});

        // NOTE This should be refactored to be clearer
        let teachers = {
            [this.props.user.id]: true,
        };
        if (activity.mainTeacherId) {
            teachers[activity.mainTeacherId] = true;
        }
        if (activity.assistantTeacherId) {
            teachers[activity.assistantTeacherId] = false;
        }

        const newActivity = {
            availabilityTimeIntervalId: availabilityIntervalId,
            roomId: activity.room_id,
            activityRefId: activity.activityId,
            teachers: teachers,
            groupName: activity.groupName,
            startTime: moment(activity.startTime.toDate()),
            endTime: moment(activity.endTime.toDate()),
        };

        api.patch(`/time_interval/${availabilityIntervalId}/validate`, {
            activity: newActivity,
            activityInstances,
        }).then(({data, error}) => {
            if (error) {
                this.setState({errors: error, savingActivityInstances: false});
            } else if (data) {
                this.setState({savingActivityInstances: false});
                this.closeDetailModal();

                toast.success(
                    <div>
                        <p>{"Les cours pour l'activité sont créés"}</p>
                    </div>,
                    {position: toast.POSITION.BOTTOM_CENTER, autoClose: 3000}
                );

                this.updateIntervals(this.state.day, this.state.view);
            }
        });
    }

    async handleUpdateActivityInstances(activityInstances) {
        const res = await fetch(
            `/activity/${this.state.intervalStore[this.state.intervalDetail].activity_instance.activity_id}/activity_instances`,
            {
                method: "POST",
                headers: {
                    "X-Csrf-Token": csrfToken,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    activityInstances,
                }),
            }
        );

        let intervals = await res.json();

        intervals = intervals.filter(i =>
            moment(i.start).isSame(
                moment(this.state.day),
                this.state.view
            )
        );

        const intervalStore = TimeIntervalHelpers.indexById(
            intervals,
            this.state.intervalStore
        );

        toast.success(
            <div>
                <p>Les cours pour l'activité sont créés</p>
            </div>,
            {position: toast.POSITION.BOTTOM_CENTER, autoClose: 3000}
        );

        this.setState({
            selectedIntervals: _.values(intervalStore),
            intervalStore,
            isDetailModalOpen: false,
            intervalDetail: null,
        });
    }

    handleUpdateActivityInstance(changes) {
        let instance = _.get(
            this.state.intervalStore[this.state.intervalDetail],
            "activity_instance"
        );

        const BASIC_CHANGES_FILTER = [
            "room_id",
            "instances_update_scope",
            "location_id",
            "cover_teacher_id",
        ];

        const propertiesFilter = (object, filter) =>
            filter.reduce(
                (acc, filter) => ({...acc, [filter]: object[filter]}),
                {}
            );

        const instanceTeacherId = _.get(
            instance,
            "teachers_activity_instances[0].user_id"
        );

        const hasIntervalMovedToAnotherRoom =
            this.state.type === "room" &&
            instance.room_id !== this.props.room.id;
        const hasIntervalMovedToAnotherPlanning =
            changes.teacher_id &&
            this.state.type === "planning" &&
            changes.teacher_id !== instanceTeacherId;

        let hasIntervalOwnerChanged =
            hasIntervalMovedToAnotherPlanning || hasIntervalMovedToAnotherRoom;

        if (changes.cover_teacher_id) {
            const oldCoverTeacherId = _.get(instance, "cover_teacher_id");
            const coverTeacherId = changes.cover_teacher_id;

            const isIntervalOwnerNoLongerACoveringTeacher =
                oldCoverTeacherId === instanceTeacherId &&
                oldCoverTeacherId !== coverTeacherId;

            hasIntervalOwnerChanged =
                hasIntervalOwnerChanged ||
                isIntervalOwnerNoLongerACoveringTeacher;
        }

        if (instance) {
            instance = {
                ...instance,
                ...propertiesFilter(changes, BASIC_CHANGES_FILTER),
            };

            instance = {
                ...instance,
                room: _.find(this.props.rooms, r => r.id === instance.room_id),
            };


            fetch(`/activity_instance/${instance.id}`, {
                method: "PATCH",
                credentials: "same-origin",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(changes),
            })
                .then(response => response.json())
                .then((data) => {
                    if (data.error_message) {
                        toast.error(
                            `${data.error_message}`,
                            {
                                position: toast.POSITION.BOTTOM_CENTER,
                                autoClose: 3000,
                            }
                        );
                        return;
                    }

                    if (hasIntervalOwnerChanged) {
                        this.setState({
                            isDetailModalOpen: false,
                            ...this.getIntervals(
                                this.state.selectedIntervals.filter(
                                    i => i.id !== this.state.intervalDetail
                                )
                            ),
                        });
                    } else {
                        if (changes.teacher_id)
                            _.set(
                                instance,
                                "teachers_activity_instances[0].user_id",
                                changes.teacher_id
                            );
                        if (changes.cover_teacher_id !== undefined)
                            instance.cover_teacher =
                                changes.cover_teacher_id &&
                                this.props.teachers.find(
                                    t => t.id === changes.cover_teacher_id
                                );

                        let newState = this.getIntervals(
                            this.state.selectedIntervals.map(i => {

                                if (i.id === this.state.intervalDetail) {
                                    return {
                                        ...i,
                                        activity_instance: instance,
                                    };
                                }
                                return i;
                            })
                        );

                        TimeIntervalHelpers.fetchInterval(csrfToken, instance.time_interval_id).then(i => {
                            newState.selectedIntervals = [...newState.selectedIntervals.filter(inter => inter.id !== i.id), i]

                            this.setState({
                                ...newState
                            });
                        });
                    }
                    this.closeDetailModal();
                    if (data.result) {
                        toast.success(
                            ` Mise à jour de ${data.result.success} cours et création de ${data.result.conflicts.length} conflits`,
                            {
                                position: toast.POSITION.BOTTOM_CENTER,
                                autoClose: 3000,
                            }
                        );
                    } else {
                        toast.success(
                            `Le cours est mis à jour !`,
                            {
                                position: toast.POSITION.BOTTOM_CENTER,
                                autoClose: 3000,
                            }
                        );
                    }
                })
        }
    }

    async handleUpdateAllActivityInstances(schedule) {
        const instanceId = schedule.activityInstance.id;

        const res = await fetch(
            `/activity_instance/${instanceId}/update_all/${schedule.id}`,
            {
                method: "PATCH",
                credentials: "same-origin",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }
        );
        const results = await res.json();

        if (this.props.updateTimePreferences) {
            // Dans le cas d'un planning simple pour les demandes d'inscription,
            // le handler est au sein du composant wizard
            this.props.updateTimePreferences(results.intervals);
        } else {
            let intervals = results.intervals;
            const intervalStore = TimeIntervalHelpers.indexById(
                intervals,
                this.state.intervalStore
            );

            this.setState(
                {
                    selectedIntervals: _.values(intervalStore),
                    intervalStore,
                    conflicts: _.compact([
                        ...this.state.conflicts,
                        ...results.conflicts,
                    ]),
                },
                () => {
                    return toast.success(
                        `${results.success} succès - ${results.conflicts.length} conflits`,
                        {
                            position: toast.POSITION.BOTTOM_CENTER,
                            autoClose: 3000,
                        }
                    );
                }
            );
        }

        // this.setState({selectedIntervals: intervals});
    }

    async handleSimulateUpdateAllActivityInstances(event) {
        // Get check_conflicts_mass_update
        const instanceId = event.schedule.activityInstance.id;

        const res = await fetch(
            `/time_interval/${event.schedule.id}/check_conflicts/${instanceId}`,
            {
                credentials: "same-origin",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }
        );
        const checkResults = await res.json();

        const confirmationToast = ({closeToast}) => (
            <div>
                <p>
                    Mise à jour de {checkResults.success} cours et création de{" "}
                    {checkResults.conflicts.length} conflits
                </p>
                <button className="btn btn-primary m-r" onClick={closeToast}>
                    <i className="fas fa-times m-r-sm"/> Annuler
                </button>
                <button
                    className="btn btn-primary"
                    onClick={() =>
                        this.handleUpdateAllActivityInstances(event.schedule)
                    }
                >
                    <i className="fas fa-check m-r-sm"/> Confirmer
                </button>
            </div>
        );

        toast.warning(confirmationToast, {
            position: toast.POSITION.BOTTOM_CENTER,
            autoClose: null,
        });
    }

    handleUpdateTimeInterval(event) {
        const newStart = moment(event.start.toDate());
        const newEnd = moment(event.end.toDate());

        if (this.props.updateTimePreferences && false) {
            const intervals = [...this.props.intervals];
            const idx = intervals.findIndex(
                i =>
                    (i.id && i.id === event.schedule.id) ||
                    i.uid === event.schedule.id
            );
            intervals[idx] = {
                ...intervals[idx],
                start: newStart.toISOString(),
                end: newEnd.toISOString(),
            };
            this.props.updateTimePreferences(intervals);
        } else {
            // Update specific interval
            const {intervalStore} = this.state;

            const interval = intervalStore[event.schedule.id];
            interval.start = moment(interval.start)
                .year(newStart.year())
                .month(newStart.month())
                .date(newStart.date())
                .hour(newStart.hour())
                .minutes(newStart.minutes())
                .toISOString();
            interval.end = moment(interval.end)
                .year(newStart.year())
                .month(newStart.month())
                .date(newStart.date())
                .hour(newEnd.hour())
                .minutes(newEnd.minutes())
                .toISOString();
            intervalStore[event.schedule.id] = interval;

            const intervals = _.values(intervalStore);

            const toastUpdate = (
                <div>
                    <p>
                        {event.schedule.activity
                            ? "Le cours est mis-à-jour!"
                            : "La disponibilité est à jour"}
                    </p>
                    {event.schedule.activity ? (
                        <button
                            className="btn btn-primary"
                            onClick={() =>
                                this.handleSimulateUpdateAllActivityInstances(
                                    event
                                )
                            }
                        >
                            Mettre à jour tous les cours suivants
                        </button>
                    ) : null}
                </div>
            );

            const conflictResolution = (
                <div>
                    <p>Conflit Résolu !</p>
                    <button
                        className="btn btn-primary"
                        onClick={() =>
                            (window.location.href = `/planning/${
                                this.props.plannings
                                    ? this.props.plannings[0].id
                                    : 0
                            }`)
                        }
                    >
                        Retour au planning
                    </button>
                </div>
            );

            if (this.props.updateTimePreferences) {
                // Dans le cas d'un planning simple pour les demandes d'inscription,
                // le handler est au sein du composant wizard
                this.props.updateTimePreferences(intervals);
            } else {
                this.commitIntervals([interval], "");
                if (this.props.conflict) {
                    toast.success(conflictResolution, {
                        position: toast.POSITION.BOTTOM_CENTER,
                        autoClose: 3000,
                    });
                } else {
                    toast.success(toastUpdate, {
                        position: toast.POSITION.BOTTOM_CENTER,
                        autoClose:
                            event.schedule && event.schedule.activity
                                ? null
                                : 3000,
                    });
                }
            }

            this.setState({selectedIntervals: intervals, intervalStore});
        }
    }

    handleDeleteInterval(id) {
        // Delete specific interval
        const {intervalStore} = this.state;

        // the distinction is between teacher planning and ActivityApplication
        if (this.props.updateTimePreferences) {
            const updatedStore = _.omit(intervalStore, id);
            const intervalsList = _.values(updatedStore);
            this.props.updateTimePreferences(intervalsList);
        }
        if (intervalStore[id]) {
            fetch(`/time_intervals/${id}`, {
                method: "DELETE",
                credentials: "same-origin",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }).then((res) => {

                if (res.ok) {
                    _.unset(intervalStore, id);

                    this.setState({
                        selectedIntervals: _.values(intervalStore),
                        intervalStore,
                    });
                }
            });
        }

        this.closeDetailModal();
    }

    handleSimpleDeleteInterval(intervalId) {
        const store = _.omit(this.state.intervalStore, intervalId);

        this.setState({
            selectedIntervals: _.values(store),
            intervalStore: store,
        });
    }

    handleDeleteAllActivityInstances(activityId) {
        fetch(`/activity/${activityId}`, {
            method: "DELETE",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        })
            .then(response => response.json())
            .then(() => {
                toast.success(
                    "L'activité et les cours associés sont supprimés",
                    {
                        position: toast.POSITION.BOTTOM_CENTER,
                        autoClose: 3000,
                    }
                );

                this.updateIntervals(this.state.day, this.state.view);
            });
    }

    handleDeleteActivityInstance(instanceId, activityId) {
        // Delete activity instance (iff no student assigned)
        const toastDelete = (
            <div>
                <p>Le cours est supprimé!</p>
                <button
                    className="btn btn-primary"
                    onClick={() =>
                        this.handleDeleteAllActivityInstances(activityId)
                    }
                >
                    Supprimer tous les autres cours de cette activité
                </button>
            </div>
        );

        fetch(`/activity_instance/${instanceId}`, {
            method: "DELETE",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        })
            .then(response => response.json())
            .then(interval => {
                this.closeDetailModal();
                toast.success(toastDelete, {
                    position: toast.POSITION.BOTTOM_CENTER,
                });
                const intervalStore = {...this.state.intervalStore};
                // TODO Fix backend so it returns a good interval
                // ensure data consistency with back end
                // (strangely the server doesn't respond right, so quick fix)
                intervalStore[interval.id] = {
                    // interval;
                    ...interval,
                    is_validated: false,
                    activity: null,
                    activity_instance: null,
                };
                const selectedIntervals = _.values(intervalStore);
                this.setState({selectedIntervals, intervalStore});
            });
    }


    handleUpdateAttendance(intervalId, attendanceId, attended) {
        fetch(`/student_attendances/${attendanceId}`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                student_attendance: {
                    attended,
                },
            }),
        })
            .then(res => {
                if (res.ok) {
                    const interval = {
                        ...this.state.intervalStore[intervalId],
                    };
                    if (interval) {
                        interval.activity_instance.student_attendances.find(
                            a => a.id === attendanceId
                        ).attended = attended;

                        this.setState({
                            intervalStore: {
                                ...this.state.intervalStore,
                                [intervalId]: interval,
                            },
                        });
                    } else {
                        toast.error(
                            "Erreur de la mise à jour (instance introuvable)"
                        );
                    }
                }
            })
            .catch(() => toast.error("Echec de la mise à jour"));
    }

    handleUpdateAttendances(intervalId, attendances) {
        fetch(`/student_attendances/bulk`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                student_attendances: attendances,
            }),
        })
            .then(res => res.json())
            .then(({attendances}) => {
                const interval = {
                    ...this.state.intervalStore[intervalId],
                };

                if (interval) {
                    interval.activity_instance.student_attendances = attendances;

                    this.setState({
                        intervalStore: {
                            ...this.state.intervalStore,
                            [intervalId]: interval,
                        },
                    });
                } else {
                    toast.error(
                        "Erreur de la mise à jour (instance introuvable)"
                    );
                }

                this.forceUpdate();
            })
            .catch(() => toast.error("Echec de la mise à jour"))
    }

    // =============================
    // MULTIVIEW MODAL
    // =============================
    handleOpenMultiViewModal(schedule) {
        this.setState({isMultiViewModalOpen: true, selectedSchedule: schedule});
    }

    closeMultiViewModal() {
        this.setState({isMultiViewModalOpen: false, selectedSchedule: undefined});
    }

    // =============================
    // MULTIVIEW MODAL
    // =============================
    handleOpenEvaluationModal(schedule) {
        this.setState({isEvaluationModalOpen: true, selectedSchedule: schedule});
    }

    closeEvaluationModal(refresh = false) {
        this.setState({isEvaluationModalOpen: false, selectedSchedule: undefined});

        if (refresh) {
            this.fetchIntervals();
        }
    }

    // =============================
    // CREATION MODAL
    // =============================
    handleOpenCreation(newInterval) {
        this.setState({
            isCreationModalOpen: true,
            newInterval,
        });
    }

    afterOpenCreationModal() {
        // We can now access modal children references
    }

    closeCreationModal() {
        this.setState({isCreationModalOpen: false, newInterval: {}});
    }

    // =============================
    // DETAILS MODAL
    // =============================
    handleOpenDetail(interval) {
        if (this.props.updateTimePreferences) {
            return this.setState({
                isDetailModalOpen: true,
                intervalDetail: interval.id,
            });
        }

        TimeIntervalHelpers.fetchInterval(csrfToken, interval.id).then(
            newInterval => {
                let newIntervals = [...this.state.selectedIntervals];
                const intIndex = newIntervals.findIndex(
                    i => i.id === interval.id
                );

                // if (intIndex !== -1) {
                if (newIntervals.length === 0) {
                    newIntervals = [newInterval];
                } else {
                    newIntervals.splice(intIndex, 1, newInterval);
                }
                this.setState({
                    ...this.getIntervals(newIntervals),
                    isDetailModalOpen: true,
                    intervalDetail: newInterval.id,
                });
                // }
            }
        );
    }

    handleSetCoveringTeacher(teacherIdInput) {
        const oldCoverTeacherId = _.get(
            this.state.intervalStore[this.state.intervalDetail],
            "activity_instance.cover_teacher_id"
        );
        const coverTeacherId = parseInt(teacherIdInput) || null;
        const instanceId = _.get(
            this.state.intervalStore[this.state.intervalDetail],
            "activity_instance.id"
        );

        const isIntervalToBeRemoved =
            oldCoverTeacherId === this.props.user.id &&
            oldCoverTeacherId !== coverTeacherId;

        if (instanceId)
            fetch(
                `/activity_instance/${instanceId}/cover_teacher/${coverTeacherId}`,
                {
                    method: "POST",
                    headers: {
                        "X-Csrf-Token": csrfToken,
                    },
                }
            ).then(res => {
                if (res.ok)
                    this.setState({
                        ...this.getIntervals(
                            _(this.state.selectedIntervals)
                                .map(i => {
                                    if (i.id === this.state.intervalDetail) {
                                        if (isIntervalToBeRemoved) return null;

                                        return {
                                            ...i,
                                            activity_instance: {
                                                ...i.activity_instance,
                                                cover_teacher_id: coverTeacherId,
                                                cover_teacher: this.props.teachers.find(
                                                    t => t.id === coverTeacherId
                                                ),
                                            },
                                        };
                                    }

                                    return i;
                                })
                                .compact()
                                .value()
                        ),
                        isDetailModalOpen: !isIntervalToBeRemoved,
                    });
            });
    }

    activityChangeFeedback(intervalId, planningType) {
        let typeLabel;
        switch (planningType) {
            case "room":
                typeLabel = "salle";
                break;
            case "user":
                typeLabel = "professeur";
                break;
            default:
                typeLabel = "entité inconnue";
        }

        this.setState(
            {
                ...this.getIntervals(
                    this.state.selectedIntervals.filter(
                        i => i.id !== intervalId
                    )
                ),
                isDetailModalOpen: false,
                intervalDetail: {},
            },
            () =>
                toast.success(
                    `Changement de ${typeLabel} de ce cours effectué.`,
                    {
                        position: toast.POSITION.BOTTOM_CENTER,
                        autoClose: 3000,
                    }
                )
        );
    }

    afterOpenDetailModal() {
        // We can now access modal children references
    }

    closeDetailModal() {
        this.setState({isDetailModalOpen: false, intervalDetail: {}});
    }

    handleUpdateActivityInInstances(activity) {
        const intervalStore = {...this.state.intervalStore};

        _.forEach(_.values(intervalStore), ti => {
            if (ti.activity_instance && ti.activity_instance.activity_id === activity.id) {
                ti.activity_instance.activity = {
                    ...ti.activity_instance.activity,
                    ...activity
                };
            }
        });

        const selectedIntervals = _.values(intervalStore);
        this.setState({selectedIntervals, intervalStore});
    }

    closeAlert = () => {
        this.setState({showAlert: false});
    };

    // =============================
    // RENDER
    // =============================
    render() {
        // const total = TimeIntervalHelpers.computeInterval(
        //     this.state.selectedIntervals
        // );

        // const validated = TimeIntervalHelpers.computeValidatedInterval(
        //     this.state.selectedIntervals
        // );

        // const options = total - validated;

        let contextIntervals = this.props.updateTimePreferences
            ? this.props.intervals
            : this.state.selectedIntervals;

        // const rawPlanning = _.chain(contextIntervals)
        //     .filter(ti => ti.is_validated)
        //     .sortBy(ti => moment(ti.start).day())
        //     .groupBy(ti => moment(ti.start).format("dddd"))
        //     .value();

        // const showTeacher = this.props.isRoom || this.props.user;

        if (this.props.generic) {
            contextIntervals = TimeIntervalHelpers.genericIntervalsOnDay(
                contextIntervals,
                moment(this.state.day)
            );
        }

        const isMultiView = this.state.selectedPlannings.length > 1;

        const colors = TimeIntervalHelpers.getColors(
            this.props.isRoom
                ? _.get(this.props, "rooms", [])
                : _.get(this.props, "teachers", [])
        );

        let intervals = TimeIntervalHelpers.formatIntervalsForSchedule(
            contextIntervals,
            this.props.conflict,
            this.props.user,
            this.props.isRoom ? "room" : "teacher",
            this.state.selectedPlannings.length,
            colors
        );

        //Flag used to determine if we should update frontend after
        //updating an activity's room or teacher
        let planningType;
        if (this.props.user) planningType = "user";
        else if (this.props.room) planningType = "room";

        intervals = _.flatten(intervals);

        let selectValues;
        let selectOptions;

        if (!this.props.generic || this.props.isAdmin) {
            switch (this.state.type) {
                case "planning":
                    selectValues = this.state.selectedPlannings.map(id => {
                        const u = _.find(this.props.teachers, {
                            planning: {id},
                        });
                        return (
                            u && {
                                value: u.planning.id,
                                label: `${u.first_name} ${u.last_name}`,
                                bgColor: colors[u.id],
                                isFixed: u.id === this.props.user.id
                            }
                        );
                    });
                    selectOptions = this.props.teachers.map(t => ({
                        value: t.planning.id,
                        label: `${t.first_name} ${t.last_name}`,
                    }));
                    break;
                case "room":
                    selectValues = this.state.selectedPlannings.map(id => {
                        const r = _.find(this.props.rooms, {id});
                        return (
                            r && {
                                value: r.id,
                                label: r.label,
                                bgColor: colors[r.id],
                            }
                        );
                    });
                    selectOptions = this.props.rooms.map(r => ({
                        value: r.id,
                        label: r.label,
                    }));
                    break;
            }
        }

        //todo spécial pour ziggy ? => à changer pour elvis
        const ziggySelectStyles = {
            multiValue: (base, state) => ({
                ...base,
                backgroundColor: state.data.bgColor || base.backgroundColor,
                color: "white",
            }),
            multiValueRemove: (base, state) => state.data.isFixed ? ({...base, display: 'none'}) : base,
            multiValueLabel: base => ({
                ...base,
                color: "white",
            }),
            option: (base, state) => ({
                ...base,
                color: state.isFocused ? "white" : base.color,
                //background: state.bgColor || "none",
            }),
        };

        return (
            <div>
                {this.state.showAlert && (
                    <div className="alert alert-danger mt-4 mb-3" role="alert">
                        Attention, les vacances scolaires n'ont pas été importées.&nbsp;
                        <a href={`/seasons/${this.props.season.id}/edit`}>
                            Gérer dès maintenant les dates de vacances de votre école.
                        </a>

                        <button
                            type="button"
                            className="close"
                            aria-label="Close"
                            onClick={this.closeAlert}
                        >
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                )}
                {/* FILTER BAR */}
                <div className="row m-t">
                    {this.props.room ||
                    (this.props.user &&
                        this.props.user.is_teacher &&
                        this.props.isAdmin) ? (
                        <div className="flex m-l-sm flex-end-aligned">
                            <div style={{minWidth: "200px"}} className="m-r-sm">
                                <SelectActivity
                                    defaultPlanning={_.get(this.props.planning, "id") || _.get(this.props.room, "id")}
                                    mode={this.props.room ? "room" : "teacher"}
                                    teachers={this.props.teachers}
                                    rooms={this.props.room_refs}
                                    locations={this.props.locations}
                                    activities={this.props.activity_refs}
                                    onChange={this.updateTargets}
                                    lastReinitialize={this.state.lastReinitialize}/>
                            </div>

                            <div className="m-r">
                                <h3>
                                    {this.state.type === "planning"
                                        ? "Autres professeurs"
                                        : "Autres salles"}
                                    {" à afficher "}

                                    {this.props.room ? (
                                        <small>
                                            <label>
                                                {"("}
                                                <input
                                                    className="mr-3"
                                                    type="checkbox"
                                                    defaultChecked={false}
                                                    name="select-all-rooms"
                                                    disabled={this.state.loading}
                                                    onChange={e =>
                                                        this.updateTargets(
                                                            e.target.checked
                                                                ? selectOptions.map(
                                                                    opt => opt.value
                                                                )
                                                                : [this.props.room.id]
                                                        )
                                                    }
                                                />
                                                {"Toutes les salles)"}
                                            </label>
                                        </small>
                                    ) : null}
                                </h3>
                                <Select
                                    isMulti
                                    isClearable={false}
                                    hideSelectedOptions
                                    options={selectOptions}
                                    value={selectValues}
                                    styles={ziggySelectStyles}
                                    theme={theme => ({
                                        ...theme,
                                        colors: {
                                            ...theme.colors,
                                            primary: "#d63031",
                                            primary75: "#d63031",
                                            primary50: "#d63031",
                                            primary25: "#d63031",
                                            danger: "#f8ac59",
                                            dangerLight: "#ffe0bf",
                                        },
                                    })}
                                    onChange={values =>
                                        this.updateTargets(
                                            values.map(v => v.value)
                                        )
                                    }
                                />
                            </div>

                            <div className="flex flex-end-aligned">
                                <button
                                    className="btn btn-primary m-r"
                                    data-tippy-content="Réinitialiser les filtres"
                                    onClick={() => {
                                        if (this.props.room) {
                                            this.updateTargets([this.props.room.id]);
                                        } else {
                                            this.updateTargets([this.props.planning.id]);
                                        }

                                        this.setState({lastReinitialize: Date.now()})
                                    }}>
                                    <i className="fas fa-times"/>
                                </button>
                                {this.props.room &&
                                    <button
                                        className="btn btn-primary"
                                        data-toggle="modal"
                                        data-target="#room-activities-modal"
                                        data-tippy-content="Activités de cette salle">
                                        <i className="fas fa-list"/>
                                    </button>
                                }
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* CALENDAR */}
                <CustomCalendar
                    selectedPlannings={this.state.selectedPlannings}
                    intervals={intervals}
                    generic={this.props.generic}
                    user={this.props.user}
                    isTeacher={this.props.isTeacher}
                    isAdmin={this.props.isAdmin}
                    season={this.props.season}
                    seasons={this.props.seasons}
                    nextSeason={this.props.nextSeason}
                    conflicts={this.state.conflicts}
                    conflict={this.props.conflict}
                    displayOnly={this.props.displayOnly}
                    isRoomCalendar={this.props.isRoom}
                    day={this.state.day}
                    loading={this.state.loading}
                    view={this.state.view}
                    updateIntervals={this.updateIntervals.bind(this)}
                    beforeCreateSchedule={!isMultiView ? interval => {
                        if (interval.isAllDay) {
                            return false;
                        }

                        return this.props.show_availabilities && (this.props.modal || (!this.props.displayOnly && this.props.isTeacher))
                            ? this.handleOpenCreation(interval)
                            : this.handleCreateInterval(interval);
                    } : e => e.guide.clearGuideElement()}
                    beforeUpdateSchedule={event => {
                        //only admins can move activities intervals
                        // const canModify = !isMultiView && (
                        //     event.schedule.isValidated === false ||
                        //     this.props.isAdmin);

                        const canModify = !isMultiView && (this.props.teacher_can_edit && this.props.isTeacher) || this.props.isAdmin

                        return canModify &&
                        (this.props.modal || !this.props.displayOnly) &&
                        (!this.props.generic || !event.schedule.isValidated)
                            ? this.handleUpdateTimeInterval(event)
                            : null;
                    }}
                    beforeDeleteSchedule={event => {
                        return this.handleDeleteInterval(event);
                    }}
                    clickSchedule={
                        !isMultiView
                            ? e => {
                                if (e.schedule.isAllDay) return;

                                // If evaluation
                                if (e.schedule.kind === "e") {
                                    this.handleOpenEvaluationModal(e.schedule.raw);
                                    return;
                                }

                                return (!this.props.displayOnly ||
                                    e.schedule.isValidated) &&
                                this.props.detailsModal
                                    ? this.props.user.is_teacher ? this.handleOpenDetail(e.schedule) : e.schedule.activity ? null : this.handleDeleteInterval(e.schedule.id)
                                    : null;
                            }
                            : e => this.handleOpenMultiViewModal(e.schedule)
                    }
                />

                {this.props.displayRaw ? (
                    <Fragment>
                        <hr className="hr-line-solid"/>
                        <RawPlanning
                            seasons={this.props.seasons}
                            data={this.state.selectedIntervals.reduce((acc, i) => {
                                const k = moment(i.start).isoWeekday() % 7;
                                return {
                                    ...acc,
                                    [k]: (acc[k] && [...acc[k], i]) || [i],
                                };
                            }, {})}
                        />
                    </Fragment>
                ) : null}

                {this.props.room && <RoomActivitiesListModal
                    room={this.props.room}
                    refs={this.props.room.activity_refs}/>}

                <Modal
                    isOpen={this.state.isMultiViewModalOpen}
                    onRequestClose={() => this.closeMultiViewModal()}
                    ariaHideApp={false}
                    className="test2"
                    style={{content: {overflow: "auto"}}}
                    contentLabel="Detail d'un créneau"
                >
                    <MultiViewModal
                        onClose={() => this.closeMultiViewModal()}
                        schedule={this.state.selectedSchedule}
                        teachers={this.props.teachers}
                    />
                </Modal>

                <Modal
                    ariaHideApp={false}
                    isOpen={this.state.isEvaluationModalOpen}
                    className="test2"
                    onRequestClose={() => this.closeEvaluationModal()}
                    style={{content: {overflow: "auto"}}}
                >
                    <EvaluationModal
                        schedule={this.state.selectedSchedule}
                        newStudentLevelQuestions={this.props.new_student_level_questions}
                        seasons={this.props.seasons}
                        onSave={() => this.closeEvaluationModal(true)}
                        onDelete={(intervalId) => {
                            this.handleSimpleDeleteInterval(intervalId);
                            this.closeEvaluationModal(false);
                        }}
                    />
                </Modal>

                <Modal
                    ariaHideApp={false}
                    isOpen={this.state.isCreationModalOpen}
                    onAfterOpen={() => this.afterOpenCreationModal()}
                    onRequestClose={() => this.closeCreationModal()}
                    className="test"
                    contentLabel="Creation d'un créneau"
                >
                    <CreateIntervalModal
                        newInterval={this.state.newInterval}
                        onSave={(interval, seasonId) =>
                            this.handleCreateInterval(interval, seasonId)
                        }
                        closeModal={() => this.closeCreationModal()}
                        seasons={this.props.seasons}
                    />
                </Modal>

                <Modal
                    isOpen={this.state.isDetailModalOpen}
                    onAfterOpen={() => this.afterOpenDetailModal()}
                    onRequestClose={() => {
                        if (!this.props.show_availabilities) {
                            return this.handleDeleteInterval(this.state.intervalDetail);
                        }

                        this.closeDetailModal();
                    }}
                    ariaHideApp={false}
                    className="test2"
                    style={{content: {overflow: "auto"}}}
                    contentLabel="Detail d'un créneau"
                >
                    <ActivityDetailsModal
                        interval={
                            // this.state.intervalDetail
                            (this.state.intervalDetail &&
                                this.state.intervalStore[
                                    this.state.intervalDetail
                                    ]) ||
                            {}
                        }
                        closeModal={() => {
                            if (!this.props.show_availabilities && this.state.intervalDetail) {
                                return this.handleDeleteInterval(this.state.intervalDetail);
                            }

                            this.closeDetailModal();
                        }}
                        season={this.props.season}
                        seasons={this.props.seasons}
                        generic={this.props.generic}
                        isAdmin={this.props.isAdmin}
                        planningType={planningType}
                        isTeacher={this.props.isTeacher}
                        activityChangeFeedback={(int, type) =>
                            this.activityChangeFeedback(int, type)
                        }
                        handleSaveActivityInstances={(
                            availabilityInterval,
                            activity,
                            activityInstances
                        ) =>
                            this.handleCreateActivityInstances(
                                availabilityInterval,
                                activity,
                                activityInstances
                            )
                        }
                        handleUpdateActivityInstances={async (id, instances) =>
                            await this.handleUpdateActivityInstances(id, instances)
                        }
                        handleEditActivityInstance={instance =>
                            this.handleUpdateActivityInstance(instance)
                        }
                        handleDeleteInterval={id => {
                            if (this.props.updateTimePreferences) {
                                return this.handleDeleteInterval(
                                    this.state.intervalDetail
                                );
                            } else {
                                return this.handleDeleteInterval(id);
                            }
                        }}
                        handleDeleteActivityInstance={(
                            instanceId,
                            activityId
                        ) =>
                            this.handleDeleteActivityInstance(
                                instanceId,
                                activityId
                            )
                        }
                        handleRemoveStudent={(activity, student) =>
                            this.handleRemoveStudent(activity, student)
                        }
                        handleRemoveOptionalStudent={(
                            activity,
                            optionalStudent
                        ) =>
                            this.handleRemoveOptionalStudent(
                                activity,
                                optionalStudent
                            )
                        }
                        handleUpdateInstance={(k, v) =>
                            this.handleUpdateActivityInstance(k, v)
                        }
                        handleUpdateAttendance={this.handleUpdateAttendance.bind(
                            this
                        )}
                        handleUpdateAllAttendances={this.handleUpdateAttendances.bind(
                            this
                        )}
                        handleSetCoveringTeacher={teacherId =>
                            this.handleSetCoveringTeacher(teacherId)
                        }
                        userActivities={
                            this.props.isRoom
                                ? this.props.activity_refs
                                : this.props.user_act
                        }
                        locations={this.props.locations}
                        room_refs={this.props.room_refs}
                        rooms={this.props.rooms}
                        planning={this.props.planning}
                        teachers={this.props.teachers}
                        evaluation_level_refs={this.props.evaluation_level_refs}
                        user={this.props.user}
                        errors={this.state.errors}
                        handleUpdateActivityInInstances={
                            act => this.handleUpdateActivityInInstances(act)
                        }
                        savingActivityInstances={this.state.savingActivityInstances}
                    />
                </Modal>
            </div>
        );
    }
}

Planning.propTypes = propTypes;

export default Planning;
