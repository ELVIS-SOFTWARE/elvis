import React from "react";
import util from "tui-code-snippet";
import Calendar from "tui-calendar";

import * as TimeIntervalHelpers from "./TimeIntervalHelpers";
import { getHoursString } from "../utils/DateUtils";

import moment from "moment-timezone";

import day from "dayjs";
import _ from "lodash";

const EVENT_TYPES = [
    "beforeCreateSchedule",
    "beforeDeleteSchedule",
    "beforeUpdateSchedule",
    "clickSchedule",
];

function getTimeTemplate(schedule, isMultiView, show_activity_code, {isAllDay=false, isRoomCalendar=false, seasons=[], user=null,}) {
    const html = [];
    const start = day(schedule.start.toUTCString());

    if (!isAllDay) {
        if (schedule.activity && schedule.activity.group_name && show_activity_code ) {
            html.push(`<span>${schedule.activity.group_name}</span><br \>`)
        }

        html.push("<span>" + start.format("HH:mm") + "</span>");
    }

    let pattern = "";

    switch(_.get(_.get(schedule.raw, "activity_instance.activity.location") || _.get(schedule.raw, "activity.location"), "label")) {
        case "Harfleur":
            pattern = "pattern-stars";
        default:
            break;
    }

    if(pattern)
        html.push(`<div class="${pattern}"></div>`);

    if (schedule.isPrivate) {
        html.push('<span class="calendar-font-icon ic-lock-b"></span>');
        html.push(" Private");
    } else {
        if (schedule.isReadOnly) {
            html.push('<span class="calendar-font-icon ic-readonly-b"></span>');
        } else if (schedule.recurrenceRule) {
            html.push('<span class="calendar-font-icon ic-repeat-b"></span>');
        } else if (schedule.attendees.length > 0) {
            html.push('<span class="calendar-font-icon ic-user-b"></span>');
        } else if (schedule.location) {
            html.push('<span class="calendar-font-icon ic-location-b"></span>');
        }
        const teacherName =
            schedule.teacher.first_name + " " + schedule.teacher.last_name;
        const roomName = schedule.location;
        let secondLineDisplay = isRoomCalendar ? teacherName : roomName;
        const seasonForLevel = TimeIntervalHelpers.getSeasonFromDate(
            schedule.start.toDate(),
            seasons
        );

        let thirdLineDisplay = "";
        if (schedule.activity && schedule.activityInstance)
        {
            const students = TimeIntervalHelpers.omitInactiveStudents(schedule.activity.users, schedule.activityInstance.inactive_students);

            console.log(students);
            
            thirdLineDisplay = (students.length === 1 ? `${students[0].first_name} ${students[0].last_name}` : students.length +
                    "/" +
                    schedule.activity.activity_ref.occupation_limit +
                    " - " +
                    TimeIntervalHelpers.levelDisplay(
                        students,
                        schedule.activity.activity_ref.id,
                        seasonForLevel ? seasonForLevel.id : 0
                    )) +
                " - " +
                TimeIntervalHelpers.averageAgeDisplay(TimeIntervalHelpers.averageAge(students));
        }

        let title = "Disponibilité";
        switch (schedule.kind) {
            case "o":
                title = "Dispo. Option";
                break;
            case "c":
                title = "Dispo. Cours";
                break;
            case "e":
                title = "Dispo. Evaluation"
                break;
        }
        if (schedule.isValidated) {
            title = schedule.title;
        }

        if(schedule.raw.comment)
            title += '<i class="m-l-xs fa fa-comment"></i>';

        const coverTeacher = _.get(schedule.raw.activity_instance, "cover_teacher");
        if(coverTeacher) {
            const teacher = _.get(schedule.activity, "teacher");

            if(teacher && teacher.id === user.id) {
                thirdLineDisplay = `Remplacé par <a style="color:inherit;font-weight:bold;" href="/users/${coverTeacher.id}">${coverTeacher.first_name} ${coverTeacher.last_name}</a>`;
            } else if(teacher && coverTeacher.id === user.id) {
                thirdLineDisplay = `Remplaçant de <a style="color:inherit;font-weight:bold;" href="/users/${teacher.id}">${teacher.first_name} ${teacher.last_name}</a>`
            }
        }
    
        if (!isMultiView) {
            html.push(
                " - " +
                    title +
                    "</br><span class='ti-second-line'>" +
                    secondLineDisplay +
                    "</span></br><span class='ti-third-line'>" +
                    thirdLineDisplay +
                    "</span>"
            );
        } else {
            html.push(" - " + title);
        }
    }

    return html.join("");
}

class CustomCalendar extends React.Component {
    constructor(props) {
        super(props);

        this.calRef = React.createRef();
    }

    componentDidMount() {     
        const timezoneName = moment.tz.guess();
        Calendar.setTimezoneOffsetCallback(function(timestamp) {
            return moment.tz.zone(timezoneName).utcOffset(timestamp);
        });

        const props = this.props;

        const scheduleView = ["time"];

        if (!this.props.generic) scheduleView.push("allday");

        const isMultiView = this.props.selectedPlannings.length > 1;
        
        this.calendar = new Calendar(this.calRef.current, {
            usageStatistics: false,
            taskView: false,
            scheduleView,
            useCreationPopup: false,
            useDetailPopup: false,
            isReadOnly: this.props.displayOnly || isMultiView,
            disableClick: isMultiView,
            disableDbClick: isMultiView,
            week: {
                startDayOfWeek: 1,
                narrowWeekend: false,
                daynames: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
                hourStart: 8,
                hourEnd: 22,
            },
            template: {
                timegridDisplayPrimaryTime: function(time) {
                    return time.hour + ":" + time.minutes;
                },
                monthGridHeader(model) {
                    const date = new Date(model.date);
                    const template =
                        '<span class"tui-full-calendar-weekday-grid-date">' +
                        date.getDate() +
                        "</span>";
                    return template;
                },
                weekDayname(dayname) {
                    return `<div class="flex">
                        <div class="m-r-md">
                            ${
                                props.generic
                                    ? ""
                                    : `<span class="m-r-sm tui-full-calendar-dayname-date">
                                ${dayname.date}
                            </span>`
                            }
                            <span class="tui-full-calendar-dayname-name">
                                ${dayname.dayName}
                            </span>
                        </div>
                        ${
                            props.user &&
                            !props.generic &&
                            (props.isAdmin || props.isTeacher)
                                ? `<a href="/users/${props.user.id}/presence_sheet/${dayname.renderDate}"
                                class="badge badge-primary" style="align-self: center;">
                                Présences
                            </a>`
                                : ""
                        }
                    </div>`;
                },
                allday(schedule) {
                    return schedule.title + ' <i class="fas fa-refresh"></i>';
                },
                time: (schedule) => {
                    return getTimeTemplate(
                        schedule,
                        isMultiView,
                        this.props.show_activity_code,
                        {
                            isAllDay:false,
                            isRoomCalendar: props.isRoomCalendar,
                            seasons: props.seasons,
                            user: props.user
                        }
                    );
                },
            },
            ...this.props.options,
        });

        const isDateValid = d => !isNaN(d.valueOf());

        if (this.props.conflict) {
            this.calendar.setDate(moment(this.props.conflict.ts));
            this.setState({ currentDate: this.calendar.getDate().toDate() });
        } else {
            let startDate = isDateValid(this.props.day)
                ? this.props.day
                : new Date();
            this.calendar.setDate(startDate);
            this.setState({ currentDate: this.calendar.getDate().toDate() });
        }

        this.registerEvents();
        this.renderCal();
    }

    componentDidUpdate(prevProps) {
        EVENT_TYPES.map(event => {
            if (this.props[event] !== prevProps[event]) {
                this.calendar.off(event);
                this.calendar.on(event, this.props[event]);
            }
        });
        this.renderCal();
    }

    componentWillUnmount() {
        this.calendar.destroy();
    }

    calculateTotalHours() {
        moment.locale("fr");
        const currentDate = moment(this.props.day);

        const lessonIntervals = this.props.intervals.filter(
            i =>
                (i.isValidated && i.kind === "c") ||
                (i.kind === "p" &&
                    i.start !== i.end &&
                    moment(i.start).isSame(currentDate, this.props.view))
        );
        const optionIntervals = this.props.intervals.filter(
            i =>
                i.isValidated &&
                i.kind === "o" &&
                i.start !== i.end &&
                moment(i.start).isSame(currentDate, this.props.view)
        );

        const lessonMinutes = lessonIntervals.map(i =>
            moment(i.end).diff(i.start, "minutes")
        );
        const optionMinutes = optionIntervals.map(i =>
            moment(i.end).diff(i.start, "minutes")
        );

        const lessonTotal = lessonMinutes.reduce((a, b) => a + b, 0) / 60;
        const optionTotal = optionMinutes.reduce((a, b) => a + b, 0) / 60;

        return {
            lesson: lessonTotal,
            option: optionTotal,
        };
    }

    registerEvents() {
        const events = EVENT_TYPES.reduce((handlers, event) => {
            if (this.props[event]) {
                return { ...handlers, [event]: this.props[event] };
            }

            return handlers;
        }, {});

        this.calendar.on(events);
    }

    renderCal() {
        this.calendar.clear();
        this.calendar.createSchedules(this.props.intervals);
        this.calendar.render();
    }

    handleToggleView(view) {
        this.calendar.changeView(view, true);
        if (view !== this.props.view)
            this.props.updateIntervals(this.props.day, view);
    }

    handleToggleTodayView() {
        this.calendar.setDate(new Date());
        this.props.updateIntervals(new Date(), this.props.view);
        this.setState({ currentDate: new Date() });
    }
    handleToggleSeasonStartView() {
        const seasonStart = new Date(this.props.season.start);
        this.calendar.setDate(seasonStart);
        this.props.updateIntervals(seasonStart, this.props.view);
    }
    handleToggleNextSeasonStartView() {
        const nextSeasonStart = new Date(this.props.nextSeason.start);

        // si le jour de la semaine n'est pas lundi, ajuster nextSeasonStart
        if (nextSeasonStart.getDay() !== 1) {
            nextSeasonStart.setDate(nextSeasonStart.getDate() + (1 + 7 - nextSeasonStart.getDay()) % 7);
        }

        this.calendar.setDate(nextSeasonStart);
        this.props.updateIntervals(nextSeasonStart, this.props.view);
        this.setState({ currentDate: nextSeasonStart });
    }
    handleTogglePrev() {
        this.calendar.prev();
        this.props.updateIntervals(
            this.calendar.getDate().toDate(),
            this.props.view
        );
        this.setState({ currentDate: this.calendar.getDate().toDate() });
    }
    handleToggleNext() {
        this.calendar.next();
        this.props.updateIntervals(
            this.calendar.getDate().toDate(),
            this.props.view
        );
        this.setState({ currentDate: this.calendar.getDate().toDate() });
    }

    handleSetToConflictDate(ts) {
        const conflictDate = moment(ts);
        conflictDate.startOf("week");
        this.calendar.setDate(conflictDate.toDate());
        this.props.updateIntervals(conflictDate.toDate(), this.props.view);
        this.setState({ currentDate });
    }

    render() {
        const totalHours = this.calculateTotalHours();

        return (
            <React.Fragment>
                {this.props.conflict || this.props.generic ? null : (
                    <CalendarControls
                        currentDate={this.props.day}
                        conflicts={this.props.conflicts}
                        view={this.props.view}
                        totalHours={totalHours}
                        handleToggleView={view => this.handleToggleView(view)}
                        handleToggleSeasonStartView={() =>
                            this.handleToggleSeasonStartView()
                        }
                        handleToggleNextSeasonStartView={() =>
                            this.handleToggleNextSeasonStartView()
                        }
                        handleToggleTodayView={() =>
                            this.handleToggleTodayView()
                        }
                        handleTogglePrev={() => this.handleTogglePrev()}
                        handleToggleNext={() => this.handleToggleNext()}
                        handleSetToConflictDate={ts =>
                            this.handleSetToConflictDate(ts)
                        }
                    />
                )}

                <div className="loader-wrap">
                    {this.props.loading && <div className="loader">Chargement...</div>}
                    <div ref={this.calRef} className={"conflict-calendar" + (this.props.loading && " loading" || "")} />
                </div>
            </React.Fragment>
        );
    }
}

const CalendarControls = ({
    currentDate,
    view,
    totalHours,
    handleToggleView,
    handleToggleTodayView,
    handleToggleSeasonStartView,
    handleToggleNextSeasonStartView,
    handleTogglePrev,
    handleToggleNext,
    handleSetToConflictDate,
    conflicts,
}) => {
    const filteredConflicts = _.filter(conflicts, c => !c.is_resolved);

    return (
        <React.Fragment>
            <div className="calendar-header">
                <div className="calendar-header-group">
                    <div className="date-component">
                        <button
                            className="btn btn-primary"
                            onClick={() => handleTogglePrev()}
                        >
                            <i className="fas fa-arrow-left" />
                        </button>
                        {currentDate != null ? (
                            <CurrentDateDisplay
                                currentDate={currentDate}
                                view={view}
                            />
                        ) : null}
                        <button
                            className="btn btn-primary"
                            onClick={() => handleToggleNext()}
                        >
                            <i className="fas fa-arrow-right" />
                        </button>
                    </div>
                    <span className="separator">|</span>
                    <div datatoggle="buttons-checkbox">
                        <button
                            className={`btn btn-primary ${view === "month" && "active"}`}
                            onClick={() => handleToggleView("month")}
                        >
                            Mois
                        </button>
                        <button
                            className={`btn btn-primary ${view === "week" && "active"}`}
                            onClick={() => handleToggleView("week")}
                        >
                            Semaine
                        </button>
                        <button
                            className={`btn btn-primary ${view === "day" && "active"}`}
                            onClick={() => handleToggleView("day")}
                        >
                            Jour
                        </button>
                    </div>
                    <span className="separator">|</span>
                </div>

                <div className="calendar-header-group">
                    <div className="btn-group">
                        <button
                            className="btn btn-primary"
                            data-tippy-content="Début de saison"
                            onClick={() => handleToggleSeasonStartView()}>
                            <i className="fas fa-angle-double-left"></i>
                        </button>
                        <button
                            className="btn btn-primary"
                            data-tippy-content="Aujourd'hui"
                            onClick={() => handleToggleTodayView()}>
                            <i className="fas fa-arrow-down"></i>
                        </button>
                        <button
                            className="btn btn-primary"
                            data-tippy-content="Prochaine Saison"
                            onClick={() => handleToggleNextSeasonStartView()}>
                            <i className="fas fa-angle-double-right"></i>
                        </button>
                    </div>
                    <span className="separator">|</span>
                    {conflicts && filteredConflicts.length > 0 ? (
                        <React.Fragment>
                            {/*<div className="btn-group">
                                <button
                                    data-toggle="dropdown"
                                    className="btn btn-warning dropdown-toggle"
                                >
                                    <i className="fas fa-exclamation-triangle m-r-sm" />
                                    {filteredConflicts.length} conflits
                                </button>
                                <ul className="dropdown-menu dropdown-menu-conflit">
                                    {_.map(filteredConflicts, (c, i) => (
                                        <ConflictDisplayItem
                                            key={i}
                                            conflict={c}
                                            currentDate={currentDate}
                                            handleSetToConflictDate={ts =>
                                                handleSetToConflictDate(ts)
                                            }
                                        />
                                    ))}
                                </ul>
                                </div> */}
                        </React.Fragment>
                    ) : null}
                    <div className="m-l">
                        <h3>
                            {`Nombre d'heures de cours : ${getHoursString(
                                totalHours.lesson
                            )}, Options: ${getHoursString(totalHours.option)}`}
                        </h3>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

const ConflictDisplayItem = ({
    conflict,
    currentDate,
    handleSetToConflictDate,
}) => {
    const start = currentDate ? moment(currentDate) : null;
    const end = moment(start).add(6, "d");
    const conflictTs = moment(conflict.ts);
    const isConflictDisplayedOnCalendar = conflictTs.isBetween(start, end);

    let icon;
    switch (conflict.kind) {
        case "room":
            icon = <i className="fas  fa-building" />;
            break;
        case "teacher":
            icon = <i className="fas fa-male" />;
            break;
        case "holiday":
            icon = <i className="fas fa-calendar" />;
            break;
    }

    let seeConflict;
    if (conflict.kind == "room") {
        seeConflict = (
            <a
                href={`/plannings/conflict/${conflict.id}`}
                className="conflict-item"
            >
                {icon}
                <span className="conflict-item-infos">
                    <b>{moment(conflict.ts).format("D MMM YYYY - HH:mm")}</b>
                    {conflict.id}
                </span>
            </a>
        );
    } else {
        seeConflict = (
            <button
                onClick={() => handleSetToConflictDate(conflict.ts)}
                className="btn btn-sm btn-primary"
            >
                {icon} Voir le conflit
            </button>
        );
    }

    return (
        <li>
            {/* {icon}
            {conflict.id + ' - '}
            <b>{moment(conflict.ts).format('D MMM YYYY HH:mm')}</b> */}
            {isConflictDisplayedOnCalendar && conflict.kind != "room" ? (
                <button className="btn btn-sm btn-primary">Résolu</button>
            ) : (
                seeConflict
            )}
        </li>
    );
};

const currentDateInclude = (currentDate, ts) => {};

const CurrentDateDisplay = ({ currentDate, view }) => {
    // TODO We can do much better, but not for now
    const date = moment(currentDate);
    let dateFormat = "";
    switch (view) {
        case "day":
            dateFormat = date.format("DD MMMM YYYY");
            break;
        case "week":
            dateFormat =
                date.format("DD") +
                " - " +
                date.add(6, "d").format("DD MMMM YYYY");
            break;
        case "month":
            dateFormat = date.format("MMMM YYYY");
            break;
    }

    return <h4>{dateFormat}</h4>;
};

export default CustomCalendar;
