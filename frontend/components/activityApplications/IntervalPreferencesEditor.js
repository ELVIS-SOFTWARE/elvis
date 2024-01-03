import React from "react";
import * as api from "../../tools/api";
import PreferencesEditor from "./TimeIntervalPreferencesEditor";
import { WEEKDAYS } from "../../tools/constants";

class IntervalPreferencesEditor extends React.PureComponent {
    constructor(props) {
        super(props);

        const selectedIntervals = Object.keys(this.props.preferences).length
            ? this.props.preferences
            : this.props.activityRefs.reduce((obj, ref) => {
                obj[ref.id] = [];
                return obj;
            }, {});

        this.state = {
            intervals: {},
            selectedIntervals,
            errors: [],
        };

        this.handleSelectInterval = this.handleSelectInterval.bind(this);
        this.handleDown = this.handleDown.bind(this);
        this.handleUp = this.handleUp.bind(this);
        this.handleMove = this.handleMove.bind(this);
    }

    componentDidMount() {
        const requests = this.props.activityRefs.map(ref =>
            api
                .get(
                    `/time_interval_preferences/${this.props.season.id}/${ref.id}`
                )
                .then(({ data, error }) => {
                    if (error) {
                        this.setState({ errors: error });
                    } else {
                        this.setState({
                            intervals: {
                                ...this.state.intervals,
                                [ref.id]: data,
                            },
                        });
                    }
                })
        );

        Promise.all(requests);
    }

    handleSelectInterval(refId, interval, selected) {
        const intervals = selected
            ? [...this.state.selectedIntervals[refId], interval]
            : this.state.selectedIntervals[refId].filter(
                i => i.id !== interval.id
            );

        const selectedIntervals = {
            ...this.state.selectedIntervals,
            [refId]: intervals,
        };

        this.setState({ selectedIntervals });

        this.props.onUpdate(selectedIntervals);
    }

    handleMove(refId, index, shift) {
        const intervals = [...this.state.selectedIntervals[refId]];
        const elementToMove = intervals.splice(index, 1);
        intervals.splice(index + shift, 0, elementToMove[0]);

        const selectedIntervals = {
            ...this.state.selectedIntervals,
            [refId]: intervals,
        };

        this.setState({
            selectedIntervals,
        });

        this.props.onUpdate(selectedIntervals);
    }

    handleUp(refId, index) {
        this.handleMove(refId, index, -1);
    }

    handleDown(refId, index) {
        this.handleMove(refId, index, 1);
    }

    render() {
        const { intervals, selectedIntervals } = this.state;

        return (
            <div className="row">
                <div className="col-lg-12">
                    {this.props.activityRefs.map(ref => intervals[ref.id] &&
                        <div className="ibox" key={ref.id}>
                            <div className="ibox-title bg-primary">
                                <h3>{`Préférences horaires pour l'activité (${ref.label})`}</h3>
                            </div>
                            <div className="ibox-content">
                                <PreferencesEditor
                                    intervals={intervals[ref.id]}
                                    groupNameAccessor={weekday => WEEKDAYS[weekday]}
                                    selectedIntervals={selectedIntervals[ref.id]}
                                    handleSelectInterval={(interval, selected) => this.handleSelectInterval(ref.id, interval, selected)}
                                    handleUp={i => this.handleUp(ref.id, i)}
                                    handleDown={i => this.handleDown(ref.id, i)} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export default IntervalPreferencesEditor;
