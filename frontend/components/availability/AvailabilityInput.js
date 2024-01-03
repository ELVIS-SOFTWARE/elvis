import React from "react";
import {checkStartEndTime, getNextWeekWithoutSunday} from "../../tools/date";
import {timeToDate} from "../../tools/format";
import {KINDS_LABEL} from "../../tools/constants";

class AvailabilityInput extends React.PureComponent {
    constructor(props) {
        super(props);

        const date = this.props.day ? new Date(this.props.day) : new Date();

        const options = getNextWeekWithoutSunday(date).sort(
            (a, b) => a.day - b.day
        );

        this.state = {
            weekday: options[0].value,
            start: "08:00",
            end: "09:00",
            options,
            kind: this.props.kinds[0],
        };

        this.handleHours = this.handleHours.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
        this.handleAdd = this.handleAdd.bind(this);
    }

    handleSelect(e) {
        this.setState({[e.target.name]: e.target.value});
    }

    handleHours(e) {
        const start =
            e.target.name === "start" ? e.target.value : this.state.start;
        const end = e.target.name === "end" ? e.target.value : this.state.end;

        this.setState({start, end});
    }

    handleAdd() {
        const {
            weekday,
            start,
            end,
            kind,
            comment,
        } = this.state;

        this.props.onAdd({
            from: timeToDate(start, weekday),
            to: timeToDate(end, weekday),
            kind,
            comment,
        });
    }

    handleChangeComment(e) {
        this.setState({
            comment: e.target.value,
        });
    }

    render() {
        const {disabled, showDates, showComment, kinds} = this.props;
        const {start, end, weekday, options, kind} = this.state;

        const isInvalidInterval = !checkStartEndTime(start, end);

        return (
            <div className="ibox">
                {this.props.selectionLabels &&
                    <div className="ibox-title bg-primary">
                        {this.props.selectionLabels.length > 1 ?
                            <h3>Préférences horaires pour l'activité ({this.props.selectionLabels[0]})</h3>
                            :
                            <h3>Préférences horaires pour les activités ({this.props.selectionLabels.join(', ')})</h3>
                        }
                    </div>}
                <div className="ibox-content">
                    {kinds.length > 1 ? (
                        <div className="form-group">
                            {kinds.map(k => (
                                <label key={k} className="radio-inline">
                                    <input
                                        type="radio"
                                        name="kind"
                                        checked={kind === k}
                                        value={k}
                                        onChange={this.handleSelect}
                                    />
                                    {KINDS_LABEL[k]}
                                </label>
                            ))}
                        </div>
                    ) : null}

                    <div className="input-group m-b-sm">
                        <span className="input-group-addon font-bold bg-muted">
                            {"Jour"}
                        </span>
                        <select
                            name="weekday"
                            className="form-control"
                            value={weekday}
                            onChange={this.handleSelect}
                        >
                            {options.map((opt, i) => (
                                <option key={i} value={opt.value}>
                                    {showDates ? opt.fullday : opt.weekday}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="row">
                        <div className="col-sm-6 m-b-sm">
                            <div
                                className={`input-group ${
                                    isInvalidInterval ? "has-error" : ""
                                }`}
                            >
                                <span
                                    className="input-group-addon font-bold bg-muted"
                                    style={{minWidth: "50px"}}
                                >
                                    {"De"}
                                </span>
                                <input
                                    className="form-control"
                                    type="time"
                                    min="08:00"
                                    max="21:00"
                                    value={start}
                                    onChange={this.handleHours}
                                    required
                                    step={180}
                                    name="start"
                                />
                            </div>
                        </div>

                        <div className="col-sm-6 m-b-sm">
                            <div
                                className={`input-group ${
                                    isInvalidInterval ? "has-error" : ""
                                }`}
                            >
                                <span
                                    className="input-group-addon font-bold bg-muted"
                                    style={{minWidth: "50px"}}
                                >
                                    {"à"}
                                </span>
                                <input
                                    className="form-control"
                                    type="time"
                                    min={start}
                                    max="21:00"
                                    value={end}
                                    required
                                    step={180}
                                    onChange={this.handleHours}
                                    name="end"
                                />
                            </div>
                        </div>
                    </div>

                    {
                        showComment && <div className="input-group m-b">
                            <span className="input-group-addon bg-muted font-bold">
                                Commentaire
                            </span>
                            <textarea
                                defaultValue=""
                                className="form-control"
                                placeholder="Vous pouvez renseigner quelques précisions ici..."
                                onChange={e => this.handleChangeComment(e)}/>
                        </div>
                    }

                    <div className="clearfix">
                        <button
                            className="btn btn-primary pull-right"
                            type="button"
                            disabled={disabled || isInvalidInterval}
                            onClick={this.handleAdd}
                        >
                            <i className="fas fa-plus"/> {"Créer la disponibilité"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default AvailabilityInput;
