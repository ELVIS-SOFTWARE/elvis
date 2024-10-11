import React from "react";
import { get } from "../../tools/api";
import { toast } from "react-toastify";
import { API_ERRORS_MESSAGES } from "../../tools/constants";
import PreferencesEditor from "./TimeIntervalPreferencesEditor";

const monthNameFormat = new Intl.DateTimeFormat("fr", {month: "long"});
const weekDayDateFormat = new Intl.DateTimeFormat("fr", {weekday: "short", day: "numeric"});

export default class EvaluationIntervalChoice extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            intervals: {},
            loading: false,
            selectedIntervals: this.props.selectedEvaluationIntervals || {},
        }
    }

    componentDidMount() {
        this.setState({loading: true});

        Promise.all(
            Object.keys(this.state.selectedIntervals).map(refId => {
                return get(`/seasons/${this.props.season.id}/available_evaluation_intervals/${refId}`)
                    .then(({data, err}) => {
                        if(err) {
                            return { err };
                        }
        
                        return {
                            refId,
                            data,
                        };
                    });
            })
        ).then(objs => objs
            .reduce((acc, {data, refId, err}) => 
                err ? { ...acc, err } : { ...acc, [refId]: data },
                {},
            )
        )
        .then(({err, ...intervals}) => {
            this.setState({ loading: false });

            if(err) {
                console.error(err);
                toast.error(API_ERRORS_MESSAGES.default, {autoClose: 3000});
                return;
            }

            this.setState({
                intervals,
            });
        });
    }

    handleSelectInterval(refId, interval, selected) {
        const selectedInterval = selected ? interval : null;

        const selectedIntervals = {
            ...this.state.selectedIntervals,
            [refId]: selectedInterval,
        };

        this.setState({
            selectedIntervals,
        });

        this.props.handleUpdateSelectedEvaluationIntervals(selectedIntervals);
    }

    render() {
        const { activityRefs } = this.props;
        const { loading, intervals } = this.state;

        let { selectedIntervals } = this.state;

        selectedIntervals = _.mapValues(
            selectedIntervals,
            (interval, refId) => interval && intervals[refId] && intervals[refId].find(i => i.id === interval.id),
        );

        const groupedIntervals = _.mapValues(intervals,
            ints => ints.reduce((acc, i) => {
                    const month = new Date(i.start).getMonth();

                    return {
                        ...acc,
                        [month]: [
                            ...(acc[month] || []),
                            i,
                        ],
                    };
                },
                {},
            )
        );

        const intervalsChoices = Object.entries(selectedIntervals).map(([activityRefId, interval]) => {
            const activityRef = activityRefs.find(r => r.id == activityRefId);

            return <ActivityEvaluationIntervalChoice
                key={activityRefId}
                activityName={activityRef.kind}
                intervals={intervals[activityRefId]}
                groupedIntervals={groupedIntervals[activityRefId]}
                selectedInterval={interval}
                loading={loading}
                handleSelectInterval={(i, s) => this.handleSelectInterval(activityRefId, i, s)} />;
        });

        return <div>
            {intervalsChoices}
        </div>
    }
}

function ActivityEvaluationIntervalChoice({
    activityName,
    loading,
    intervals,
    groupedIntervals,
    selectedInterval,
    handleSelectInterval,
}) {
    return <div className="ibox">
        <div className="ibox-title">
            <h3>
                Créneaux d'évaluation disponibles pour {activityName}
            </h3>
        </div>
        <div className="ibox-content">
            <div className="loader-wrap">
                {loading && <div className="loader">Chargement...</div>}
                {
                    intervals && intervals.length ?
                    <div className={loading && "loading" || ""}>
                        <PreferencesEditor
                            maxIntervals={1}
                            intervals={groupedIntervals}
                            intervalHeader={i => weekDayDateFormat.format(new Date(i.start))}
                            selectedIntervals={selectedInterval && [selectedInterval] || []}
                            groupNameAccessor={k => monthNameFormat.format(new Date(2000, parseInt(k)))}
                            handleSelectInterval={handleSelectInterval}/>
                    </div> :
                    <p className="text-primary font-bold">
                        {"Aucun créneau d'évaluation disponible actuellement, nous reviendrons vers vous très vite pour vous en proposer un."}
                    </p>
                }
            </div>
        </div>
    </div>;
}