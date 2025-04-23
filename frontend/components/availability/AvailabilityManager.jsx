import React, {Fragment, PureComponent} from "react";
import * as api from "../../tools/api";
import AvailabilityInput from "./AvailabilityInput";
import AvailabilityList from "./AvailabilityList";
import ErrorList from "../common/ErrorList";
import WeekSelector from "./WeekSelector";
import {INTERVAL_KINDS} from "../../tools/constants";
import AvailabilityCommentModal from "./AvailabilityCommentModal";
import moment from "moment";
import _ from "lodash";

const kindsForSeason = [
    INTERVAL_KINDS.LESSON,
    INTERVAL_KINDS.OPTION,
];
const kindsForEvaluation = [...kindsForSeason, INTERVAL_KINDS.EVALUATION];
const kindsForStudent = [INTERVAL_KINDS.AVAILABILITY];

function addToken(url, token) {
    return `${url}${token ? `?auth_token=${token}` : ""}`;
}

class AvailabilityManager extends PureComponent {
    constructor(props) {
        super(props);

        // State
        this.state = {
            errors: [],
            list: [],
            isFetching: false,

            selectedIntervalIdForComment: null,
        };

        // this bindings
        this.handleAdd = this.handleAdd.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.toggleFetching = this.toggleFetching.bind(this);
        this.updateCommentIntervalId = this.updateCommentIntervalId.bind(this);
    }

    componentDidMount() {
        const fixedIntervals = (this.props.intervals || []).map(interval => {
            if (!interval.id && !interval.tabId) {
                return {
                    ...interval,
                    tabId: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                };
            }
            return interval;
        });

        this.setState({
            list: fixedIntervals,
        });
    }

    toggleFetching() {
        this.setState({isFetching: !this.state.isFetching, errors: []});
    }

    handleAdd(interval) {
        const getNewTabId = (list) => list.length > 0
            ? Math.max(...list.map(i => i.tabId !== undefined ? i.tabId : -1)) + 1
            : 0;

        if (this.props.planningId === undefined && this.props.disableLiveReload) {
            // new members in wizard mode
            const newTabId = getNewTabId(this.state.list);
            const newInterval = {
                start: new Date(interval.from).toISOString(),
                end: new Date(interval.to).toISOString(),
                kind: interval.kind,
                is_validated: false,
                created_at: undefined,
                updated_at: undefined,
                id: undefined,
                tabId: newTabId
            }

            this.setState(prevState => ({
                list: prevState.list.concat([newInterval]),
                isFetching: false,
            }), () => {
                this.props.onAdd([newInterval]);
            });
        } else {
            api.set()
                .before(this.toggleFetching)
                .success(data => {
                    if (this.props.onAdd) {
                        this.props.onAdd(data.intervals);
                    }

                    this.setState(prevState => ({
                        list: prevState.list.concat(data.intervals.map(interval => ({
                            ...interval,
                            tabId: interval.id || getNewTabId(prevState.list),
                        }))),
                        isFetching: false,
                    }));
                })
                .error(errors => this.setState({errors, isFetching: false}))
                .patch(addToken(`/plannings/availabilities/${this.props.planningId}${this.props.disableLiveReload ? "/can_update" : ""}`, this.props.authToken), {
                    ...interval,
                    season_id: this.props.seasonId,
                });
        }
    }

    handleDelete(ids) {
        this.toggleFetching();

        const intervalIds = Array.isArray(ids) ? ids : [ids];

        if (this.props.disableLiveReload) {
            const list = [...this.state.list];

            intervalIds.forEach(id => {
                const index = list.findIndex(interval => interval.tabId === id);
                if (index !== -1) {
                    list.splice(index, 1);
                }
            });

            this.props.onDelete(list);
            this.setState({list, isFetching: false});
        } else {
            Promise.all(
                intervalIds.map(id => api.del(addToken(`/time_intervals/${id}`, this.props.authToken)))
            ).then(responses => {
                // Error handling
                const errors = [];
                const list = [...this.state.list];

                responses.forEach(resp => {
                    if (resp.error) {
                        errors.push(resp.error);
                    } else if (resp.data) {
                        list.splice(
                            list.findIndex(
                                interval => interval.id === resp.data.id
                            ),
                            1
                        );
                    }
                });

                if (errors.length) {
                    this.setState({errors, list, isFetching: false});
                } else {
                    if (this.props.onDelete) {
                        this.props.onDelete(list);
                    }

                    this.setState({list, isFetching: false});
                }
            });
        }
    }

    updateCommentIntervalId(selectedIntervalIdForComment) {
        this.setState({
            selectedIntervalIdForComment,
        });
    }

    updateInterval(newInterval) {
        const newList = _.keyBy(this.state.list, "id");
        newList[newInterval.id] = newInterval;

        this.setState({
            list: _.values(newList),
            selectedIntervalIdForComment: null,
        });
    }

    render() {
        const {
            day,
            seasonId,
            user,
            locked,
            isTeacher,
            planningId,
            forSeason,
            kinds,
        } = this.props;

        const {list, errors, isFetching, selectedIntervalIdForComment} = this.state;

        const selectedIntervalForComment = selectedIntervalIdForComment && this.state.list.find(i => i.id === selectedIntervalIdForComment);

        return (
            <Fragment>
                <ErrorList errors={errors}/>

                <div className="p-xs">
                    {!locked ? (
                        <div className="row">
                            {!forSeason ? (
                                <div className="col-lg-6">
                                    <div className="ibox">
                                        <div className="ibox-title">
                                            <h3>{"Choix de la semaine"}</h3>
                                        </div>

                                        <div className="ibox-content">
                                            <WeekSelector
                                                planningId={planningId}
                                                day={day}
                                                buttonLabel="Changer"
                                                alignRight
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            <div className={`${!forSeason ? "col-lg-6" : "col-lg-12"}`}>
                                <AvailabilityInput
                                    selectionLabels={this.props.selectionLabels}
                                    onAdd={this.handleAdd}
                                    day={day}
                                    disabled={isFetching}
                                    showDates={!this.props.forSeason}
                                    kinds={kinds}
                                    showComment={isTeacher}
                                    availabilityMessage={this.props.availabilityMessage}
                                />
                            </div>
                        </div>
                    ) : null}

                    <AvailabilityList
                        list={list}
                        disabled={isFetching}
                        showActions={!locked}
                        canComment={isTeacher}
                        onDelete={this.handleDelete}
                        onComment={this.updateCommentIntervalId}
                        allowedKinds={kinds}
                        kinds={
                            isTeacher
                                ? forSeason
                                    ? kindsForSeason
                                    : kindsForEvaluation
                                : kindsForStudent
                        }
                    />

                    {selectedIntervalForComment && <AvailabilityCommentModal
                        user={user}
                        availability={selectedIntervalForComment}
                        onClose={() => this.updateCommentIntervalId(null)}
                        onSaved={i => this.updateInterval(i)}/>}
                </div>
            </Fragment>
        );
    }
}

export default AvailabilityManager;
