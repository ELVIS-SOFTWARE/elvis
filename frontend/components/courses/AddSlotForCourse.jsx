import React from "react";
import Input from "../common/Input";
import TimePicker from "rc-time-picker";
import "rc-time-picker/assets/index.css";
import InputSelect from "../common/InputSelect";
import { toast } from "react-toastify";
import { MESSAGES } from "../../tools/constants";
import { checkStartEndTime } from "../../tools/date";
import moment from "moment";
import * as api from "../../tools/api.js";
import AddCourseSummary from "./AddCourseSummary";

export default class AddSlotForCourse extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            seasons: undefined,
            seasonId: this.props.initialValues.seasonId,
            startTime: this.props.initialValues.startTime,
            endTime: this.props.initialValues.endTime,
            dayOfWeek: this.props.initialValues.dayOfWeek,
            fromDate: this.props.initialValues.fromDate,
            toDate: this.props.initialValues.toDate,
            href_path: this.props.href_path,
            summary: this.props.summary,
        };

        this.handleSeasonChange = this.handleSeasonChange.bind(this);
        this.handleTimeChange = this.handleTimeChange.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
        api.get(`/seasons`).then(({ data, error }) => {
            if (error) {
                console.log(error);
            } else {
                const firstDay = this.processFirstDay(this.props.initialValues);
                const update = { ...this.state, ...firstDay };

                update.summary = { ...update.summary, ...firstDay };
                update.seasons = data;
                this.setState(update);
                this.props.onChange(update);
            }
        });

        const weekDay = this.state.dayOfWeek;
        if (weekDay) {
            let radioButtons = document.getElementById("dayOfWeekSelector")
                .children;
            radioButtons[parseInt(weekDay) - 1].className += " active";
        }
    }

    isValidated() {
        const { dayOfWeek, startTime, endTime, fromDate, toDate } = this.state;

        if (!startTime || !endTime || !dayOfWeek) {
            toast.error(MESSAGES.err_must_choose_slot, { autoClose: 3000 });
            return false;
        }

        if (startTime._d > endTime._d) {
            toast.error(MESSAGES.err_negative_date_range, { autoClose: 3000 });
            return false;
        }

        if (
            !checkStartEndTime(
                startTime.format("HH:mm"),
                endTime.format("HH:mm")
            )
        ) {
            toast.error(MESSAGES.err_negative_hour_range, { autoClose: 3000 });
            return false;
        }

        return true;
    }

    handleSeasonChange(event) {
        const selected = this.state.seasons.find(
            season => season.id == event.target.value
        );

        if (selected) {
            const update = { ...this.state };

            update.season = { id: selected.id, label: selected.label };
            /**
             * fromDate: premier jour de recurrence du cours
             * toDate: dernier jour de recurrence du cours
             * startTime: premier jour de cours et heure de debut de cours
             * endTime: premier jour de cours et heure de fin de cours
             */

            let fromDate = document.getElementById("fromDate");
            let startTime = moment(selected.start).set({
                hour: this.state.startTime.hours(),
                minute: this.state.startTime.minutes(),
            });
            fromDate.value = startTime.format("YYYY-MM-DD");

            let toDate = document.getElementById("toDate");
            let endTime = moment(selected.start).set({
                hour: this.state.endTime.hours(),
                minute: this.state.endTime.minutes(),
            });
            toDate.value = moment(selected.end).format("YYYY-MM-DD");

            update.fromDate = fromDate.value;
            update.toDate = toDate.value;
            update.startTime = startTime;
            update.endTime = endTime;

            this.handleChange(update);
        }
    }

    handleTimeChange(name, value) {
        let time = value.split(":");
        let newValue = {};
        newValue[name] = this.state[name];
        newValue[name].set({ hour: time[0], minute: time[1] });
        this.handleChange(newValue);
    }

    handleChange(newValues) {
        const update = { ...this.state, ...newValues };

        const fromDate = update.fromDate.split("-");
        const toDate = update.toDate.split("-");

        update.startTime = update.startTime.set({
            date: fromDate[2],
            month: fromDate[1] - 1,
            year: fromDate[0],
        });
        update.endTime = update.endTime.set({
            date: toDate[2],
            month: toDate[1] - 1,
            year: toDate[0],
        });

        const firstDay = this.processFirstDay(update);

        update.summary = {
            ...this.state.summary,
            dayOfWeek: update.dayOfWeek,
            ...firstDay,
        };

        this.setState({...update,...firstDay});
        this.props.onChange({ ...update, ...firstDay });
    }

    processFirstDay(update) {
        const { fromDate, toDate, startTime, endTime, dayOfWeek } = update;


        let firstDayStartTime = new Date(fromDate);
        let firstDayEndTime = new Date(fromDate);

        let dayIndex = firstDayStartTime.getDay();
        let offset = parseInt(dayOfWeek, 10) - dayIndex;

        if (offset < 0) {
            offset += 7;
        }

        firstDayStartTime.setDate(firstDayStartTime.getDate() + offset);
        firstDayEndTime.setDate(firstDayEndTime.getDate() + offset);

        firstDayStartTime = moment(firstDayStartTime);
        firstDayEndTime = moment(firstDayEndTime);

        firstDayStartTime.set({hour:startTime.get('hour'), minute:startTime.get('minute')})
        firstDayEndTime.set({hour:endTime.get('hour'), minute:endTime.get('minute')})

        let firstDay = {};
        firstDay["firstDayStartTime"] = firstDayStartTime;
        firstDay["firstDayEndTime"] = firstDayEndTime;

        return firstDay;
    }

    render() {
        const {
            seasons,
            seasonId,
            startTime,
            endTime,
            fromDate,
            toDate,
            href_path,
            summary,
        } = this.state;

        return (
            <div className="row">
                <div className="col-md-8">
                    <div className="ibox">
                        <div className="ibox-title flex">
                            <i className="fa fa-clock m-sm"></i>
                            <h3>Choix d'un créneau</h3>
                        </div>
                        <div className="ibox-content">
                            <div className="row">
                                {
                                    <div className="col-md-4">
                                        {seasons && (
                                            <InputSelect
                                                input={{
                                                    name: "season",
                                                    onChange: this
                                                        .handleSeasonChange,
                                                    defaultValue: seasonId,
                                                }}
                                                meta={{}}
                                                label="Saison"
                                                required={true}
                                                options={seasons.map(season => {
                                                    return {
                                                        value: season.id,
                                                        label: `${season.label}`,
                                                    };
                                                })}
                                                button={{
                                                    icon: "fa fa-plus-circle",
                                                    href_path: `${href_path}/seasons/new`,
                                                    text: "",
                                                    tooltip: "Créer une saison",
                                                }}
                                            />
                                        )}
                                    </div>
                                }
                                {
                                    <div className="col-md-4">
                                        <Input
                                            label="Début"
                                            required={true}
                                            input={{
                                                id: "fromDate",
                                                type: "date",
                                                name: "fromDate",
                                                defaultValue: fromDate,
                                                onChange: e =>
                                                    this.handleChange({
                                                        fromDate:
                                                            e.target.value,
                                                    }),
                                            }}
                                            meta={{}}
                                        />
                                    </div>
                                }
                                {
                                    <div className="col-md-4">
                                        <Input
                                            label="Fin"
                                            required={true}
                                            input={{
                                                id: "toDate",
                                                type: "date",
                                                name: "toDate",
                                                defaultValue: toDate,
                                                onChange: e =>
                                                    this.handleChange({
                                                        toDate: e.target.value,
                                                    }),
                                            }}
                                            meta={{}}
                                        />
                                    </div>
                                }
                            </div>
                            <div className="row">
                                {" "}
                                <div className="col-md-4"></div>
                                <div className="col-md-8 font-weight-bold">
                                    <i className="fa fa-exclamation-circle m-r-xs"></i>
                                    Vous pouvez modifier la période de la saison
                                    sélectionnée
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label>
                                            Jour{" "}
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <div className="form-group">
                                            <div
                                                id="dayOfWeekSelector"
                                                className="btn-group-toggle"
                                                data-toggle="buttons"
                                                onClick={e => {
                                                    this.handleChange({
                                                        dayOfWeek:
                                                            e.target.firstChild
                                                                .value,
                                                    });
                                                }}
                                            >
                                                <label
                                                    className={
                                                        "btn btn-primary btn-outline m-r-sm"
                                                    }
                                                >
                                                    <input
                                                        type="radio"
                                                        name="dayOfWeek"
                                                        value="1"
                                                        autoComplete="off"
                                                    />{" "}
                                                    Lundi
                                                </label>
                                                <label className="btn btn-primary btn-outline m-r-sm">
                                                    <input
                                                        type="radio"
                                                        name="dayOfWeek"
                                                        value="2"
                                                        autoComplete="off"
                                                    />{" "}
                                                    Mardi
                                                </label>
                                                <label className="btn btn-primary btn-outline m-r-sm">
                                                    <input
                                                        type="radio"
                                                        name="dayOfWeek"
                                                        value="3"
                                                        autoComplete="off"
                                                    />{" "}
                                                    Mercredi
                                                </label>
                                                <label className="btn btn-primary btn-outline m-r-sm">
                                                    <input
                                                        type="radio"
                                                        name="dayOfWeek"
                                                        value="4"
                                                        autoComplete="off"
                                                    />{" "}
                                                    Jeudi
                                                </label>
                                                <label className="btn btn-primary btn-outline m-r-sm">
                                                    <input
                                                        type="radio"
                                                        name="dayOfWeek"
                                                        value="5"
                                                        autoComplete="off"
                                                    />{" "}
                                                    Vendredi
                                                </label>
                                                <label className="btn btn-primary btn-outline">
                                                    <input
                                                        type="radio"
                                                        name="dayOfWeek"
                                                        value="6"
                                                        autoComplete="off"
                                                    />{" "}
                                                    Samedi
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row ">
                                <div className="col-md-2">
                                    <label>
                                        Horaire{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                </div>
                            </div>

                            <div className="row m-b-lg">
                                <div className="col-md-3">
                                    <div className="input-group">
                                        <span
                                            className="input-group-addon font-bold bg-muted"
                                            style={{ minWidth: "50px" }}
                                        >
                                            {"De"}
                                        </span>
                                        <input
                                            className="form-control"
                                            type="time"
                                            min="08:00"
                                            max="21:00"
                                            defaultValue={startTime.format(
                                                "HH:mm"
                                            )}
                                            onChange={e =>
                                                this.handleTimeChange(
                                                    e.target.name,
                                                    e.target.value
                                                )
                                            }
                                            required
                                            step={180}
                                            name="startTime"
                                        />
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="input-group">
                                        <span
                                            className="input-group-addon font-bold bg-muted"
                                            style={{ minWidth: "50px" }}
                                        >
                                            {"à"}
                                        </span>
                                        <input
                                            className="form-control"
                                            type="time"
                                            min={startTime}
                                            max="21:00"
                                            defaultValue={endTime.format(
                                                "HH:mm"
                                            )}
                                            required
                                            step={180}
                                            onChange={e =>
                                                this.handleTimeChange(
                                                    e.target.name,
                                                    e.target.value
                                                )
                                            }
                                            name="endTime"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-lg-8">
                                    <p className="alert alert-info">
                                        Votre cours va être créé avec une
                                        récurrence hebdomadaire (hors vacances
                                        scolaires)
                                    </p>
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
