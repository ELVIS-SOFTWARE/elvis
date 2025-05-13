import React from "react";
import _ from "lodash";

const moment = require("moment");
require("moment/locale/fr");

import ReactModal from "react-modal";
import ReactTable from "react-table";

import * as api from "../../../tools/api";
import * as TimeIntervalHelpers from "../../planning/TimeIntervalHelpers";
import {csrfToken, FR_DATE_FORMAT, findAndGet, optionMapper} from "../../utils";
import {radioValue} from "../../evaluation/question/radio_question";
import {PRE_APPLICATION_ACTION_LABELS, modalStyle, WEEKDAYS} from "../../../tools/constants.js";
import {displayActivityRef, formatActivityHeadcount, occupationInfos, toAge} from "../../../tools/format";
import WorkGroupEditor from "./WorkGroupEditor";

// SUB COMPONENTS

const LevelCell = ({
                       user,
                       activityId,
                       seasons,
                       activityRefId,
                       timeInterval,
                       activityRef,
                       initialLevel = null
                   }) => {
    const [studentLevel, setStudentLevel] = React.useState(initialLevel);
    const [isLoading, setIsLoading] = React.useState(!initialLevel);

    React.useEffect(() => {
        if (initialLevel) return;

        let isMounted = true;
        setIsLoading(true);

        api
            .set()
            .get(`/desired_activities/user/${user.id}/activity/${activityId}`)
            .then(response => {
                if (isMounted) {
                    const apiLevel = response?.data?.evaluation_level_ref;

                    if (!apiLevel) {
                        const computedLevel = TimeIntervalHelpers.levelDisplayForActivity(
                            {
                                users: [user],
                                activity_ref_id: activityRefId,
                                time_interval: timeInterval,
                                activity_ref: activityRef
                            },
                            seasons
                        );
                        setStudentLevel(computedLevel || 'NON INDIQUÉ');
                    } else {
                        setStudentLevel(apiLevel);
                    }
                }
            })
            .catch(error => {
                console.error('[LevelCell] Erreur récupération level :', error);
                if (isMounted) {
                    const computedLevel = TimeIntervalHelpers.levelDisplayForActivity(
                        {
                            users: [user],
                            activity_ref_id: activityRefId,
                            time_interval: timeInterval,
                            activity_ref: activityRef
                        },
                        seasons
                    );
                    setStudentLevel(computedLevel || 'NON INDIQUÉ');
                }
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [user.id, activityId, initialLevel, activityRefId, timeInterval, activityRef, seasons]);

    if (isLoading) {
        return <>Chargement...</>;
    }

    if (studentLevel === 'NON INDIQUÉ') {
        return <>NON INDIQUÉ</>;
    }

    return <>{studentLevel}</>;
};


const SubStudentList = ({ row, seasons }) => {
    const activeStudents = row.original.users.map(u => ({ ...u, type: 'active' }));

    const inactiveStudents = row.original.inactive_users
        .map(u => {
            const application = _.find(
                u.activity_applications,
                app => app.desired_activities.map(da => da.activity_id).includes(row.original.id)
            );
            const beginAt = application && new Date(application.begin_at);
            const closestLesson = new Date(row.original.closest_lesson);
            if (!application || beginAt > closestLesson) return null;
            return { ...u, type: 'inactive', application };
        })
        .filter(u => u != null);

    const optionStudents = row.original.options.map(o => {
        const user = _.get(o, 'desired_activity.activity_application.user');
        const optionLevel = _.get(o, 'desired_activity.activity_application.evaluation_level_ref') || null;
        return { ...user, type: 'option', optionLevel };
    });

    const combinedUsers = _.orderBy(
        [...activeStudents, ...inactiveStudents, ...optionStudents],
        u => u.last_name
    );

    const isWorkGroup = row.original.activity_ref.is_work_group;

    return (
        <div className="flex-column">
            <div className="flex" style={{ padding: '15px' }}>
                <h3 className="m-r">
                    Effectifs au : {moment(row.original.closest_lesson).format('DD/MM/YYYY')}
                </h3>
            </div>
            <table className="table table-bordered">
                <thead>
                <tr>
                    <th>Nom</th>
                    <th>Âge</th>
                    <th>Niveau</th>
                    {isWorkGroup && <th>Instrument</th>}
                    <th>Début le</th>
                    <th>Arrêt le</th>
                </tr>
                </thead>
                <tbody>
                {combinedUsers.map((u, index) => {
                    let customStyle = {};
                    if (u.type === 'inactive') customStyle = { color: '#ff001a' };
                    else if (u.type === 'option') customStyle = { color: '#9575CD' };

                    const userInstrument = isWorkGroup
                        ? row.original.activities_instruments
                        .filter(ai => ai.user_id === u.id)
                        .map(ai => _.get(ai, 'instrument.label'))
                        .join(', ') || 'NON ASSIGNÉ'
                        : null;

                    return (
                        <tr key={u.id || index} style={customStyle}>
                            <td>
                                <a href={
                                    u.activity_applications?.[0]?.id
                                        ? `/inscriptions/${u.activity_applications[0].id}`
                                        : '#'
                                } target="_blank">
                                    {u.first_name} {u.last_name}
                                </a>
                            </td>
                            <td>{TimeIntervalHelpers.age(u.birthday)} ans</td>
                            <td>
                                <LevelCell
                                    user={u}
                                    activityId={row.original.id}
                                    seasons={seasons}
                                    activityRefId={row.original.activity_ref_id}
                                    timeInterval={row.original.time_interval}
                                    activityRef={row.original.activity_ref}
                                />
                            </td>
                            {isWorkGroup && <td>{userInstrument}</td>}
                            <td>
                                {(() => {
                                    const app = u.application ||
                                        u.activity_applications?.find(a =>
                                            a.desired_activities.some(
                                                da => da.activity_id === row.original.id
                                            )
                                        );
                                    return app?.begin_at
                                        ? Intl.DateTimeFormat('fr').format(new Date(app.begin_at))
                                        : '';
                                })()}
                            </td>
                            <td>
                                {(() => {
                                    const app = u.application ||
                                        u.activity_applications?.find(a =>
                                            a.desired_activities.some(
                                                da => da.activity_id === row.original.id
                                            )
                                        );
                                    return app?.stopped_at
                                        ? Intl.DateTimeFormat('fr').format(new Date(app.stopped_at))
                                        : '';
                                })()}
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};


const createAllExpanded = pageSize => _.zipObject(_.range(pageSize), _.times(pageSize, () => ({})));

// MAIN COMPONENT
class Activity extends React.Component {
    constructor(props) {
        super(props);

        let level = "";

        const levelSeason = _.find(
            props.application.user.levels,
            l =>
                l.activity_ref_id === props.activityRef.id &&
                l.season_id === props.application.season_id
        );

        this.state = {
            suggestionsMode: "CUSTOM", // Values : CUSTOM (suggests activities following user's availabilities/choices), ALL (no filter, display all activities)
            loading: false,
            tableState: {
                expanded: {},
                pageSize: 10,
            },
            studentLevel: levelSeason ? levelSeason.evaluation_level_ref_id : null,
        };

        this.tableRef = React.createRef();
    }

    componentDidMount() {
        this.loadSuggestions();
    }

    componentDidUpdate(prevProps) {
        let willReloadSuggestions = false;

        willReloadSuggestions = willReloadSuggestions || !this.state.loading && this.props.isAdmin && !this.props.suggestions;
        //Reload suggestions if application's begin_at has changed
        willReloadSuggestions = willReloadSuggestions || (prevProps.application.begin_at !== this.props.application.begin_at);
        // Reload if we change stop date
        willReloadSuggestions = willReloadSuggestions || (prevProps.application.stopped_at !== this.props.application.stopped_at);

        if (willReloadSuggestions) {
            this.loadSuggestions();
        }
    }

    loadSuggestions() {
        this.setState({loading: true});
        fetch(
            `/applications/${this.props.application.id}/desired_activities/${
                this.props.desiredActivity.id
            }/suggestions?mode=${this.state.suggestionsMode || "CUSTOM"}`,
            {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }
        )
            .then(response => response.json())
            .then(suggestions => {
                // Wait for props to be update to declare loading as finished
                this.props.handleAddSuggestions(
                    this.props.activityRef.id,
                    suggestions
                ).then(() => this.setState({loading: false}));
            });
    }

    isUserInActivity(suggestion) {
        return _.some(suggestion.users.concat(suggestion.inactive_users), u => u.id == this.props.application.user.id);
    }

    // Checks if given activity is the one the user is assigned to.
    // (looks in desired activity's activity field)
    isDesiredActivityInActivity(suggestion) {
        return suggestion.id == this.props.desiredActivity.activity_id;
    }

    // Checks if given activity is one of the options the user is assigned to.
    // (looks in student's desired activity's options)
    isSuggestionInDesiredActivityOptions(suggestion) {
        return _.some(this.props.desiredActivity.options, opt => opt.activity_id == suggestion.id);
    }

    isUserInAnyActivity() {
        return _.some(this.props.suggestions, s => this.isUserInActivity(s));
    }

    isDesiredActivityInAnyActivity() {
        return _.some(this.props.suggestions, s => this.isDesiredActivityInActivity(s));
    }

    displayDuration(duration) {
        if (!duration) {
            return null;
        }

        const hours = Math.floor(duration / 60);
        const minutes = (duration % 60).toString().padStart(2, '0');

        return duration < 60 ? `- ${minutes} min` : `- ${hours}h${minutes}`;
    }

    async handleOptionButton(suggestion) {
        try {
            const isOption = this.isSuggestionInDesiredActivityOptions(suggestion);
            if (isOption) {
                await this.props.handleRemoveSuggestionOption(suggestion.id, this.props.desiredActivity);
                this.props.desiredActivity.options = this.props.desiredActivity.options.filter(opt => opt.activity_id !== suggestion.id);
            } else {
                await this.props.handleSelectSuggestionOption(suggestion.id, this.props.desiredActivity.id);
                this.props.desiredActivity.options.push({activity_id: suggestion.id});
            }
            this.forceUpdate();
        } catch (error) {
            console.error("Erreur lors de la modification de l'option", error);
        } finally {
            this.setState({ submittingOptionId: 0 });
        }
    }

    handleOpenLevelEditModal() {
        this.setState({
            isLevelEditModalOpen: true,
        });
    }

    handleCloseLevelEditModal() {
        this.setState({
            isLevelEditModalOpen: false,
        });
    }

    handleStudentLevelChange(value) {
        let studentLevel = null;

        if (value)
            studentLevel = parseInt(value);

        this.setState({
            studentLevel,
        });
    }

    handleSubmitStudentLevel() {
        const {studentLevel} = this.state;
        const {
            application: {
                season_id,
                user_id,
            },
            activityRef: {
                id: activity_ref_id
            },
        } = this.props;


        if (studentLevel === null)
            api
                .set()
                .success(() => {
                    this.setState({isLevelEditModalOpen: false});
                    this.props.handleDeleteStudentLevel(season_id, activity_ref_id);
                })
                .del(`/users/${user_id}/levels/${season_id}/${activity_ref_id}`);
        else
            api
                .set()
                .success(level => {
                    this.setState({isLevelEditModalOpen: false});
                    this.props.handleUpdateStudentLevel(level);
                })
                .post(`/users/${user_id}/levels`, {
                    season_id,
                    activity_ref_id,
                    evaluation_level_ref_id: studentLevel,
                });
    }

    handleChangeSuggestionsMode(mode) {
        const shouldReload = mode !== this.state.suggestionsMode;

        this.setState({
            suggestionsMode: mode,
        }, () => shouldReload && this.loadSuggestions());
    }

    render() {
        const self = this;
        const {suggestionsMode} = this.state;
        const desiredActivityInAnyActivity = self.isDesiredActivityInAnyActivity();
        let suggestionsColumns = [
            {
                Header: "",
                id: "more",
                expander: true,
                filterable: true,
                Filter: () => <div className="table-expanders">
                    <button
                        data-tippy-content="Tout replier"
                        data-tippy-placement="right"
                        onClick={() => this.setState({tableState: {...this.state.tableState, expanded: {}}})}>
                        <i className="fas fa-caret-up" data-fa-transform="grow-8"/>
                    </button>
                    <button
                        data-tippy-content="Tout déplier"
                        data-tippy-placement="right"
                        onClick={() => this.setState({
                            tableState: {
                                ...this.state.tableState,
                                expanded: createAllExpanded(this.state.tableState.pageSize)
                            }
                        })}>
                        <i className="fas fa-caret-down" data-fa-transform="grow-8"/>
                    </button>
                </div>,
                Expander: ({isExpanded, ...rest}) => {
                    return (
                        <div>
                            {isExpanded ? <i className="fas fa-chevron-down"/>
                                : <i className="fas fa-chevron-right"/>}
                        </div>
                    );
                },
                style: {
                    cursor: "pointer",
                    fontSize: 10,
                    paddingTop: "10px",
                    textAlign: "center",
                    userSelect: "none",
                },
            }];

        if (_.get(this.props.desiredActivity, "activity_ref.allows_timeslot_selection")) {
            suggestionsColumns.push(
                {
                    Header: "Choix",
                    id: "rank",
                    accessor: "rank",
                    maxWidth: 40,
                    Cell: ({value}) => value === 0 ? null : value
                });
        }

        suggestionsColumns = [
            ...suggestionsColumns,
            {
                Header: "Groupe",
                accessor: "group_name",
                maxWidth: 60,
            },

            {
                Header: "Jour",
                id: "day",
                maxWidth: 150,
                accessor: s => moment(s.time_interval.start).isoWeekday(),
                Cell: ({ value }) =>
                    moment(value, "E")
                        .format("dddd")
                        .toUpperCase(),
                Filter: ({ onChange }) => (
                    <select
                        defaultValue=""
                        onChange={e => onChange(parseInt(e.target.value) || "")}
                    >
                        <option value="" />
                        {WEEKDAYS.map((w, i) => ({ label: w, id: i })).map(
                            optionMapper()
                        )}
                    </select>
                ),
                filterMethod: (filter, row) =>
                    !filter || row.day === filter.value,
            },
            {
                Header: "Famille de cours",
                id: "type_cour",
                maxWidth: 150,
                accessor: "activity_ref.label",
                Filter: ({ onChange }) => (
                    <select
                        defaultValue=""
                        onChange={e => onChange(e.target.value)}
                    >
                        <option value="" />
                        {_.uniq(
                            (this.props.suggestions || []).map(
                                s => s.activity_ref.label
                            )
                        )
                            .map(s => ({
                                label: s,
                                id: s,
                            }))
                            .map(optionMapper())}
                    </select>
                ),
                filterMethod: (filter, row) =>
                    !filter || row.type_cour === filter.value,
            },
            {
                Header: "Horaires",
                id: "time",
                Filter: ({ filter, onChange }) => {
                    filter = (filter && filter.value) || {};
                    const start = filter.start || "";
                    const end = filter.end || "";

                    return (
                        <div className="flex flex-space-around-justified">
                            <input
                                type="time"
                                defaultValue={start}
                                onChange={e =>
                                    onChange({
                                        ...filter,
                                        start: e.target.value,
                                    })
                                }
                            />
                            <input
                                type="time"
                                defaultValue={end}
                                onChange={e =>
                                    onChange({
                                        ...filter,
                                        end: e.target.value,
                                    })
                                }
                            />
                        </div>
                    );
                },
                filterMethod: ({ value: { start, end } } = {}, row) => {
                    let res = true;

                    if (start)
                        res =
                            res &&
                            moment(row.time.start).format("HH:mm") >= start;

                    if (end)
                        res =
                            res && moment(row.time.end).format("HH:mm") <= end;

                    return res;
                },
                accessor: s => ({
                    start: s.closest_lesson || s.time_interval.start,
                    end: s.closest_lesson_end || s.time_interval.end,
                }),
                Cell: ({ value: v }) =>
                    `${moment(v.start).format("HH:mm")} ~> ${moment(
                        v.end
                    ).format("HH:mm")}`,
            },
            {
                Header: "Professeur",
                id: "teacher",
                accessor: ({ teacher: t }) => `${t.first_name} ${t.last_name}`,
                filterMethod: (filter, { teacher }) =>
                    !filter ||
                    teacher.match(new RegExp(`.*${filter.value}.*`, "i")),
            },
            {
                Header: "Lieu",
                id: "location",
                maxWidth: 100,
                accessor: s => s.location.label,
            },
            {
                Header: "Niveau",
                id: "level",
                maxWidth: 150,
                accessor: s => {
                    const level = TimeIntervalHelpers.levelDisplayForActivity(
                        s,
                        this.props.seasons
                    );
                    return level || "Pas de niveau";
                },
            },
            {
                Header: "Âge",
                id: "average_age",
                maxWidth: 50,
                accessor: s => TimeIntervalHelpers.averageAge(s.users),
                Cell: props =>
                    TimeIntervalHelpers.averageAgeDisplay(props.value),
            },
            {
                Header: "Occupées",
                id: "occupation",
                maxWidth: 100,
                accessor: s => {
                    let {
                        validatedHeadCount,
                        headCountLimit,
                    } = occupationInfos(s);

                    return validatedHeadCount / headCountLimit;
                },
                Cell: props => formatActivityHeadcount(props.original),
            },
            {
                Header: "Actions",
                id: "actions",
                style: { textAlign: "right" },
                filterable: false,
                maxWidth: 250,
                Cell: props => {
                    const act = props.original;

                    if (props.original.activity_ref.is_work_group) {
                        return null;
                    }

                    if (
                        self.props.desiredActivity &&
                        self.props.desiredActivity.is_validated &&
                        self.isUserInActivity(props.original)
                    ) {
                        return (
                            <button
                                className="btn btn-xs btn-primary"
                                disabled={!!this.state.submittingId}
                                onClick={() => {
                                    this.setState({ submittingId: act.id });
                                    self.props
                                        .handleRemoveStudent(
                                            act.id,
                                            self.props.desiredActivity.id,
                                            self.props.activityRef.id
                                        )
                                        .then(() =>
                                            this.setState({ submittingId: 0 })
                                        );
                                }}
                            >
                                Retirer de ce créneau &nbsp;
                                {this.state.submittingId === act.id ? (
                                    <i className="fas fa-circle-notch fa-spin"></i>
                                ) : (
                                    ""
                                )}
                            </button>
                        );
                    }

                    if (desiredActivityInAnyActivity) {
                        return null;
                    }

                    return (
                        <React.Fragment>
                            {/* Bouton Sélectionner */}
                            <button
                                disabled={
                                    self.props.isAlreadyBusy(
                                        props.original.time_interval
                                    ) ||
                                    act.users.length >=
                                    act.activity_ref
                                        .occupation_hard_limit ||
                                    !!this.state.submittingId
                                }
                                className="btn btn-xs btn-primary m-r-sm"
                                onClick={() => {
                                    this.setState({ submittingId: act.id });
                                    self.props
                                        .handleSelectSuggestion(
                                            act.id,
                                            self.props.desiredActivity.id,
                                            self.props.activityRef.id
                                        )
                                        .then(() => {
                                            this.setState({ submittingId: 0 });
                                            this.setState(prevState => ({
                                                actUsers: [...act.users],
                                            }));
                                        });
                                }}
                            >
                                Sélectionner &nbsp;
                                {this.state.submittingId === act.id ? (
                                    <i className="fas fa-circle-notch fa-spin"></i>
                                ) : (
                                    ""
                                )}
                            </button>

                            {/* Bouton Option / Retirer l'option */}
                            <button
                                disabled={
                                    act.users.some(
                                        u => u.id === this.props.userId
                                    ) || !!this.state.submittingOptionId
                                }
                                className="btn btn-xs"
                                style={{
                                    color: "#FFF",
                                    backgroundColor: "#9575CD",
                                }}
                                onClick={async () => {
                                    // Définir l'ID de l'option en cours de traitement
                                    this.setState({
                                        submittingOptionId: act.id,
                                    });

                                    try {
                                        // Appeler handleOptionButton avec l'option spécifique
                                        await this.handleOptionButton(act);
                                    } catch (error) {
                                        console.error(
                                            "Erreur lors du traitement de l'option :",
                                            error
                                        );
                                    } finally {
                                        // Réinitialiser submittingOptionId pour permettre d'autres clics
                                        this.setState({
                                            submittingOptionId: null,
                                        });
                                    }
                                }}
                            >
                                {this.isSuggestionInDesiredActivityOptions(act)
                                    ? "Retirer l'option"
                                    : "Option"}
                                &nbsp;
                                {this.state.submittingOptionId === act.id ? (
                                    <i className="fas fa-circle-notch fa-spin"></i>
                                ) : (
                                    ""
                                )}
                            </button>
                        </React.Fragment>
                    );
                },
                sortable: false,
            },
        ];

        const suggestions = this.sortSuggestions(this.props.suggestions);

        let actionLabel = "Nouvelle demande";
        if (this.props.application.pre_application_activity) {
            actionLabel =
                PRE_APPLICATION_ACTION_LABELS[
                    this.props.application.pre_application_activity.action
                ];
        } else if (this.props.pre_application_desired_activity) {
            actionLabel =
                PRE_APPLICATION_ACTION_LABELS[
                    this.props.application.pre_application_desired_activity
                        .action
                ];
        }

        let previousActivity = null;
        if (this.props.activityRef.kind === "Enfance") {
            //Look for Enfance activity in previous applications
            const previousDesired = _.chain(
                this.props.application.user.activity_applications
            )
                .filter(app =>
                    moment(app.season.end).isSame(
                        this.props.application.season.start,
                        "year"
                    )
                )
                .map(app => app.desired_activities)
                .flatten()
                .find(des => des.activity_ref.kind === "Enfance")
                .value();

            if (previousDesired) {
                const applicationActivity = previousDesired.activity;

                if (applicationActivity)
                    previousActivity = (
                        <div className="col-xs-6">
                            <p>
                                <i>Ancienne activité</i>
                            </p>
                            <p>
                                <b>
                                    {applicationActivity.activity_ref.label},{" "}
                                    {applicationActivity.time_interval ? (
                                        <React.Fragment>
                                            {_.capitalize(
                                                moment(
                                                    applicationActivity
                                                        .time_interval.start
                                                ).format("dddd")
                                            )}{" "}
                                            {moment(
                                                applicationActivity
                                                    .time_interval.start
                                            ).format("HH:mm")}
                                            {" -› "}
                                            {moment(
                                                applicationActivity
                                                    .time_interval.end
                                            ).format("HH:mm")}
                                        </React.Fragment>
                                    ) : (
                                        "Créneau introuvable"
                                    )}
                                    ,{" "}
                                    {`${applicationActivity.teacher.first_name} ${applicationActivity.teacher.last_name}`}{" "}
                                </b>
                            </p>
                        </div>
                    );
            }
        } else if (this.props.application.pre_application_activity) {
            let act = this.props.application.pre_application_activity.activity;

            if (act)
                previousActivity = (
                    <div className="col-xs-6">
                        <p>
                            <i>Ancienne activité</i>
                        </p>
                        <p>
                            <b>
                                {act.activity_ref.label},{" "}
                                {act.time_interval ? (
                                    <React.Fragment>
                                        {_.capitalize(
                                            moment(
                                                act.time_interval.start
                                            ).format("dddd")
                                        )}{" "}
                                        {moment(act.time_interval.start).format(
                                            "HH:mm"
                                        )}
                                        {" -› "}
                                        {moment(act.time_interval.end).format(
                                            "HH:mm"
                                        )}
                                    </React.Fragment>
                                ) : (
                                    "Créneau introuvable"
                                )}
                                ,{" "}
                                {`${act.teacher.first_name} ${act.teacher.last_name}`}{" "}
                            </b>
                        </p>
                    </div>
                );
        }

        let level = "";

        const levelSeason = _.find(
            this.props.application.user.levels,
            l =>
                l.activity_ref_id === this.props.activityRef.id &&
                l.season_id === this.props.application.season_id
        );

        level =
            levelSeason !== undefined && levelSeason.evaluation_level_ref !== undefined
                ? _.capitalize(levelSeason.evaluation_level_ref.label)
                : "Non indiqué";

        const desiredActivities = Array.isArray(this.props.desiredActivities)
            ? this.props.desiredActivities : Object.values(this.props.desiredActivities);

        const daIds = desiredActivities
            .filter(da => da.activity_ref_id !== this.props.activityRef.id)
            .map(da => da.activity_ref_id);

        const refsOptions = _.chain(this.props.activityRefs)
            .filter(r => !daIds.includes(r.id))
            .filter(r => this.props.activityRef.kind !== "Enfance" || r.kind === "Enfance")
            .sortBy(r => r.label)
            .map(r => <option
                key={r.id}
                value={r.id}>
                {r.label}  {self.displayDuration(r.duration)}
            </option>)
            .value();

        const shouldChangeActivityQuestion = this.props.studentEvaluationQuestions.find(q => q.name === "should_change_activity");
        const shouldChangeActivityAnswer = this.props.detectedEvaluation ?
            radioValue(
                shouldChangeActivityQuestion,
                findAndGet(
                    this.props.detectedEvaluation.answers,
                    a => a.question_id === shouldChangeActivityQuestion.id,
                    "value"
                ),
            ) :
            "Non précisé";

        return (
            <React.Fragment>
                <div className="ibox activity-application">
                    <div className="ibox-title">
                        <h5>
                            <div className="btn-group m-r">
                                <button
                                    type="button"
                                    className={`btn btn-primary btn-outline ${suggestionsMode === "CUSTOM" ? "active" : ""}`}
                                    onClick={e => this.handleChangeSuggestionsMode("CUSTOM")}>
                                    Cours suggérés
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-primary btn-outline ${suggestionsMode === "ALL" ? "active" : ""}`}
                                    onClick={e => this.handleChangeSuggestionsMode("ALL")}>
                                    Tous les cours de {displayActivityRef(this.props.activityRef)}
                                </button>
                            </div>
                            <select
                                className="custom-select m-r"
                                value={this.props.activityRef.id}
                                disabled={this.props.desiredActivity.is_validated}
                                onChange={e => this.props.handleChangeDesiredActivity(this.props.desiredActivity.id, parseInt(e.target.value))}>
                                {refsOptions}
                            </select>
                            <span className="badge badge-warning">
                                {actionLabel}
                            </span>
                        </h5>
                    </div>

                    <div className="ibox-content">
                        <div className="row m-b-md">
                            <div className="col-xs-2">
                                <p>
                                    <i>Niveau de l'élève</i>
                                </p>
                                <p>
                                    <b>{level}</b>
                                    <button type="button" onClick={() => this.handleOpenLevelEditModal()}
                                            className="btn btn-xs btn-primary m-l-sm">
                                        <i className="fas fa-edit"/>
                                    </button>
                                </p>
                            </div>
                            <div className="col-xs-2">
                                <p>
                                    <i>Changement de groupe</i>
                                </p>
                                <p>
                                    <b>{shouldChangeActivityAnswer}</b>
                                </p>
                            </div>
                            {this.props.desiredActivity.user ? (
                                <div className="col-xs-2">
                                    <p>
                                        <i>Accompagnant</i>
                                    </p>
                                    <p>
                                        <b>
                                            {`${
                                                this.props.desiredActivity.user
                                                    .first_name
                                            } ${
                                                this.props.desiredActivity.user
                                                    .last_name
                                            }`}
                                        </b>
                                    </p>
                                </div>
                            ) : null}

                            {!this.props.instruments.length == 0 ? (
                                <div className="col-xs-2">
                                    <p>
                                        <i>Instruments</i>
                                    </p>
                                    <p>
                                        <b>
                                            {this.props.instruments.map(instrument => instrument.label).join(', ')}
                                        </b>
                                    </p>
                                </div>
                            ) : null}

                            {previousActivity}

                            <div className="col-xs-12 img-rounded p-xs">
                                <p>
                                    <i className="fas fa-info-circle"/> critères pour les cours suggérés :
                                    disponibilités de l'élève, type et créneau de l'ancienne activité
                                </p>
                            </div>
                        </div>
                        <ReactTable
                            ref={this.tableRef}
                            data={suggestions || []}
                            columns={suggestionsColumns}
                            showPagination={suggestions.length > 10}
                            loading={this.state.loading}
                            resizable={false}
                            filterable
                            previousText="Précedent"
                            nextText="Suivant"
                            loadingText="Chargement..."
                            noDataText="Aucune donnée"
                            pageText="Page"
                            ofText="sur"
                            rowsText="résultats"
                            minRows={1}
                            expanded={this.state.tableState.expanded}
                            pageSize={this.state.tableState.pageSize}
                            onExpandedChange={expanded => this.setState({
                                tableState: {
                                    ...this.state.tableState,
                                    expanded
                                }
                            })}
                            onPageSizeChange={pageSize => this.setState({
                                tableState: {
                                    ...this.state.tableState,
                                    pageSize
                                }
                            })}
                            onPageChange={page => this.setState({
                                tableState: {
                                    ...this.state.tableState,
                                    expanded: {}
                                }
                            })} // Reset expanded on page change
                            onSortedChange={sorted => this.setState({
                                tableState: {
                                    ...this.state.tableState,
                                    sorted
                                }
                            })}
                            getTrProps={(state, rowInfo, column) => {
                                if (!rowInfo)
                                    return {};

                                if (
                                    this.isDesiredActivityInActivity(
                                        rowInfo.original
                                    )
                                ) {
                                    return {
                                        style: {
                                            color: "#d63031",
                                            fontWeight: "bold",
                                        },
                                    };
                                } else if (
                                    this.isSuggestionInDesiredActivityOptions(
                                        rowInfo.original
                                    )
                                ) {
                                    return {
                                        style: {
                                            color: "#9575CD",
                                            fontWeight: "bold",
                                        },
                                    };
                                }

                                return {};
                            }}
                            SubComponent={row => {
                                return row.original.activity_ref
                                    .is_work_group ? (
                                    <WorkGroupEditor
                                        activity={row.original}
                                        desiredActivity={
                                            this.props.desiredActivity
                                        }
                                        userId={this.props.application.user_id}
                                        onUpdateActivity={a => {
                                            /**
                                             * @type {function([])}
                                             */
                                            const sortSuggestions = this.sortSuggestions.bind(this);

                                            new Promise((resolve, reject) => {
                                                const news = this.props.handleUpdateSuggestion(a);

                                                const oldSuggestionIndex = suggestions.findIndex(s => s.id === a.id);

                                                let newSuggestions = sortSuggestions(Object.values(news.suggestions)[0]);

                                                const tableSortDatas = this.state.tableState.sorted;

                                                if (tableSortDatas && tableSortDatas.length > 0) {
                                                    const tableState = {...this.tableRef.current.state};

                                                    tableState.manual = true;
                                                    tableState.resolvedData = newSuggestions;
                                                    tableState.sorted = tableSortDatas;

                                                    // sort newSuggestions like react-table
                                                    newSuggestions = this.tableRef.current.getSortedData(tableState).sortedData;
                                                }

                                                const newSuggestionIndex = newSuggestions.findIndex(s => s.id === a.id);

                                                this.setState({
                                                    tableState: {
                                                        ...this.state.tableState,
                                                        expanded: {
                                                            [oldSuggestionIndex]: false,
                                                            [newSuggestionIndex]: true
                                                        }
                                                    }
                                                });

                                                resolve();
                                            });
                                        }}
                                    />
                                ) : (
                                    <SubStudentList
                                        row={row}
                                        seasons={this.props.seasons}
                                        desiredActivity={this.props.desiredActivity}
                                        referenceDate={this.props.referenceDate}

                                    />

                                );
                            }}
                        />
                    </div>
                </div>
                <ReactModal
                    ariaHideApp={false}
                    isOpen={this.state.isLevelEditModalOpen}
                    onRequestClose={() => this.handleCloseLevelEditModal()}
                    style={{
                        ...modalStyle,
                        content: {maxWidth: "300px", position: "static"},
                        overlay: {justifyContent: "center"}
                    }}>
                    <div className="ibox">
                        <div className="ibox-title">
                            <h3>Edition du niveau de {this.props.activityRef.label}</h3>
                        </div>
                        <div className="ibox-content">
                            <div className="form-group">
                                <label>Niveau</label>
                                <select
                                    className="form-control"
                                    defaultValue={levelSeason && levelSeason.evaluation_level_ref_id || ""}
                                    onChange={e => this.handleStudentLevelChange(e.target.value)}>
                                    <option value="">NON INDIQUÉ</option>
                                    {this.props.evaluationLevelRefs.map(optionMapper())}
                                </select>
                            </div>
                        </div>
                        <div className="ibox-footer flex flex-space-between-justified">
                            <button className="btn" style={{marginRight: "auto"}} type="button"
                                    onClick={() => this.handleCloseLevelEditModal()}>
                                <i className="fas fa-times m-r-sm"/>
                                Annuler
                            </button>
                            <button type="button" onClick={() => this.handleSubmitStudentLevel()}
                                    className="btn btn-primary pull-right">
                                <i className="fas fa-save m-r-sm"/>Enregistrer
                            </button>
                        </div>
                    </div>
                </ReactModal>
            </React.Fragment>
        );
    }

    /**
     *
     * @param {[]} suggestions
     * @returns {any[]}
     */
    sortSuggestions(suggestions) {
        return _.sortBy(_.filter(
            suggestions,
            s => s.time_interval
            // filtre initial surcharger par modif sur le tableau (click sur colonne)
            // les valeurs sont arbitraires
        ), s => {
            if(this.isSuggestionInDesiredActivityOptions(s))
                return -1;

            if(this.isDesiredActivityInActivity(s))
                return -2;

            return 0;
        });
    }
}

export default Activity;
