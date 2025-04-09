import _ from "lodash";
import { ISO_DATE_FORMAT } from "../utils";
import { capitalFirstLetters } from "../../tools/format";
const moment = require("moment-timezone");
require("moment/locale/fr");

//returns hsl color for planning intervals 
const MAX_HUE = 360;
const DEFAULT_SAT = 68;
const DEFAULT_LUM = 60;
const getUniformHSLColor = (i, nbColors, { maxHue = MAX_HUE, sat = DEFAULT_SAT, lum = DEFAULT_LUM } = {}) => `hsl(${i * maxHue / (nbColors + 1)}deg, ${sat}%, ${lum}%)`;

// Resources management
export const getTeacherId = (interval) => _.get(interval, ['activity_instance', 'activity', 'teacher', 'id'], null) ||
    _.get(interval, 'owner_id', null);
export const getRoomId = (interval) => _.get(interval, ['activity_instance', 'room_id'], null);
export const resourceGetters = {
    "room": getRoomId,
    "teacher": getTeacherId
};
export const getColors = (resources) => {
    const colors = {}; 

    resources.forEach((res, i) => {
        colors[res.id] = getUniformHSLColor(i, resources.length);
    });

    return colors;
};

export const omitInactiveStudents = (users, inactiveStudents) => _.differenceBy(users, inactiveStudents, 'id');

export function fetchIntervals(
    csrfToken,
    id,
    type,
    date,
    granularity,
    abortSignal,
) {
    return fetch(
        `/${type}/${id}/intervals/${granularity}/${moment(date).format(
            ISO_DATE_FORMAT
        )}`,
        {
            type: "GET",
            headers: {
                "X-Csrf-Token": csrfToken,
            },
            signal: abortSignal,
        }
    ).then(res => res.json());
}

export function fetchInterval(csrfToken, intervalId) {
    return fetch(`/time_interval/${intervalId}`, {
        type: "GET",
        headers: {
            "X-Csrf-Token": csrfToken,
        },
    }).then(res => res.json());
}

export const indexById = (intervals, store = {}) => {
    _.map(intervals, i => {
        if (i.id == undefined) {
            let maxId =
                _.size(store) == 0
                    ? 0
                    : _.chain(store)
                          .keys()
                          .max()
                          .value();
            i.id = parseInt(maxId, 10) + 1;
        }
        // We do this only if the interval is more recent than already stored
        const prevInterval = store[i.id];
        if (
            _.has(store, i.id) &&
            moment(store[i.id].updated_at).isAfter(moment(i.updated_at))
        ) {
            store[i.id] = prevInterval;
        } else {
            store[i.id] = i;
        }
    });

    return store;
};

export const genericIntervalsOnDay = (intervals, day) =>
    _.map(intervals, i => ({
        ...i,
        start: moment(i.start)
            .year(day.year())
            .week(day.week())
            .toISOString(),
        end: moment(i.end)
            .year(day.year())
            .week(day.week())
            .toISOString(),
    }));

export const kindColors = {
    e: { color: "#BD9DAD", bgColor: "#E8D1E5", borderColor: "#E8D1E5", validated: "#a35b99" },
}

export const formatIntervalsForSchedule = (rawIntervals, conflict, user, resourceType, resourceCount, colors) => {
    const isMultiView = (resourceCount > 1);

    let formattedIntervals = _.map(rawIntervals, int => {
        let color = "#9CBCAC";
        let bgColor = "#D1E7D4";
        let borderColor = color;
        let activity = undefined;

        if (int.kind === "p") {
            bgColor = "#3F51B5";
            color = "white";
            borderColor = bgColor;
        }

        // Condition existante pour les autres types
        else if (Object.keys(kindColors).includes(int.kind)) {
            color = int.is_validated ? "white" : kindColors[int.kind].color;
            bgColor = int.is_validated ? kindColors[int.kind].validated : kindColors[int.kind].bgColor;
            borderColor = bgColor;
        }
        
        // If specific multi resource view
        if (isMultiView) {
            const resourceId = resourceGetters[resourceType](int);
            bgColor = colors[resourceId];
            color = "white";
            borderColor = color;
        }

        if (int.activity_instance) activity = int.activity_instance.activity;
        else if (int.activity) activity = int.activity;

        let room = null;

        if (int.activity_instance && int.activity_instance.room)
            room = int.activity_instance.room;
        else if (activity) room = activity.room;

        if (!isMultiView && activity != undefined) {
            switch (activity.activity_ref.kind) {
                case "Enfance":
                    bgColor = "#FFC314";
                    color = "white";
                    borderColor = "#d63031";
                    break;
                case "CHAM":
                    bgColor = "#5A676F";
                    color = "white";
                    borderColor = "#d63031";
                    break;
                case "ATELIERS":
                    bgColor = "#FF9846";
                    color = "white";
                    borderColor = "#d63031";
                    break;
                default:
                    bgColor = "#E96469";
                    color = "white";
                    borderColor = "#d63031";
            }
        }

        // Exclude disponibility if in multiView
        // if (isMultiView && !activity) {
        //     return null;
        // }

        if (int.isAllDay) {
            // If the interval is all day, it's a holiday and needs no further
            // formatting
            return int;
        }

        if (resourceType === "teacher") {
            const coverTeacher = _.get(int, "activity_instance.cover_teacher");

            if(coverTeacher) {
                const teacher = _.get(activity, "teacher.id");
    
                if (isMultiView) {
                    bgColor = colors[coverTeacher.id];
                } else if(teacher === user.id) {
                    bgColor = "gainsboro";
                    color = "slategray";
                    //color border if hours are counted
                    borderColor = _.get(int, "activity_instance.are_hours_counted") ? "#d63031" : "slategray";
                } else if(coverTeacher.id === user.id) {
                    bgColor = "slategray";
                    color = "gainsboro";
                    borderColor = "gainsboro";
                }
            }
        }

        color = int.color || color;
        borderColor = int.borderColor || borderColor;

        let title = "Disponibilité";
        if (activity) {
            title = activity.activity_ref.label;
        } else if (int.kind === "e") {
            title = !int.is_validated ? "Dispo. Evaluation" : "Evaluation";
        }

        const locationLabel = _.get(activity, "location.label");
        let locationIndicator = `<b>${capitalFirstLetters(locationLabel)}</b> - `;

        return {
            id: int.id || int.uid,
            calendarId: "1",
            evaluation: int.evaluation_appointment,
            title,
            location: locationIndicator + (room && room.label || ""),
            category: "time",
            start: int.start,
            end: int.end,
            borderColor: borderColor,
            color: color,
            bgColor: bgColor,
            dragBgColor: bgColor,
            attendees: activity ? activity.users : [],
            kind: int.kind,
            teacher: (int.activity_instance && int.activity_instance.teacher) || (activity && activity.teacher || {}),
            isValidated: int.is_validated,
            activity_instance: int.activity_instance
                ? int.activity_instance
                : undefined,
            raw: int,
            activity: activity ? activity : undefined,
        };
    });

    if (conflict) {
        // Si l'on est sur le planning pour une résolution de conflict,
        // on grise et lock tous les autre intervals
        formattedIntervals = _.map(formattedIntervals, interval => {
            if (interval.id != conflict.activity_instance.time_interval_id) {
                interval.bgColor = "#EEE";
                interval.color = "#EEE";
                interval.borderColor = "#EEE";
                interval.isReadOnly = true;
            }
            return interval;
        });
    }

    return _.compact(formattedIntervals);
};

export const formatHolidays = holidays => {
    return _.map(holidays, h => {
        return {
            id: h.id,
            calendarId: "1",
            title: h.label,
            start: h.date,
            end: h.date,
            isAllDay: true,
            category: "allday",
            isReadOnly: true,
            color: "#9CBCAC",
            bgColor: "#D1E7D4",
            borderColor: "#D1E7D4",
        };
    });
};

//Returns the label of the first valid level
//found in given users for given activityref and season
export const levelDisplay = (users, activityRef, seasonId) => {
    if (!activityRef)
        activityRef = {};

    const id = activityRef.id || activityRef;

    const allLevels = _(users)
        .map(u => u.levels)
        .flatten()
        .compact()
        .filter(level => level.season_id == seasonId)
        .value();

    const exactLevels = allLevels.filter(level => level.activity_ref_id == id);


    const levelsToConsider = exactLevels;

    if (levelsToConsider.length === 0) {
        return "NON INDIQUÉ";
    }

    const uniqueLevels = _.uniqBy(levelsToConsider, "evaluation_level_ref_id");

    return uniqueLevels.length > 1
        ? "À PRÉCISER"
        : _.get(uniqueLevels, "[0].evaluation_level_ref.label") || "NON INDIQUÉ";
};

export const levelDisplayForActivity = (activity, seasons) => {
    const {
        time_interval: timeInterval,
        activity_ref: activityRef,
        evaluation_level_ref: evaluationLevelRef,
        users,
    } = activity;

    if(evaluationLevelRef)
        return evaluationLevelRef.label;

    if (timeInterval) {
        const season = getSeasonFromDate(
            timeInterval.start,
            seasons
        );

        return levelDisplay(
            users,
            activityRef,
            season ? season.id : 0
        );
    }

    return null;
}



export const age = birthday => moment().diff(birthday, "years");

export const averageAge = users => {
    return Math.floor(
        users
            .map(u => age(u.birthday))
            .reduce((sum, val) => sum + val, 0) / users.length
    );
};

export const averageAgeDisplay = age => {
    return isNaN(age) ? "" : `${age} ans`
};

// TODO Include availabilityInterval somehow
export const generateInstances = (startingDate, seasons) => {
    const season = getSeasonFromDate(startingDate, seasons);

    if (!season) return [];

    // In order to generate instance over the full season, we need to determine the first instance
    // A combinaison of the season start and of the starting date
    const firstInstance = moment(startingDate);
    const seasonStart = moment(season.start)
        .hour(firstInstance.hour())
        .minute(firstInstance.minute());

    const seasonEnd = moment(season.end);
    const holidayDates = _.map(season.holidays, h =>
        moment(h.date).format(ISO_DATE_FORMAT)
    );

    let instances = [];

    let now = firstInstance.clone();
    while (instances.length < season.nb_lessons && now.isSameOrBefore(seasonEnd) ) {
        // skip if we are on a holiday
        if(!_.includes(holidayDates, moment(now).format(ISO_DATE_FORMAT)))
            instances.push(moment(now));
        now.add(1, "week");
    }

    instances = _.uniqBy(instances, i => i.format(ISO_DATE_FORMAT));
    instances = _.map(instances, i => i.hour(firstInstance.hour()));

    return _.reduce(instances, (acc, i) => ({
        ...acc,
        [i.format(ISO_DATE_FORMAT)]: {
            start: i,
            selected: true,
        },
    }), {});
};

export const getSeasonFromDate = (date, seasons) =>
    seasons.filter(s => moment(date).isBetween(s.start, s.end))[0];

export const cutInterval = interval => {
    // Un interval avec start et end doit être divisé en un liste d'intervals d'une heure
    // Pour cela, on prend le start et on ajoute une heure, pour créer un nouveau créneau, on répète l'opération jusqu'à
    // ce que le end du nouvel interval soit égal au end de l'interval de départ
    // const intervalClone = _.clone(interval);

    // TODO We need to find a way to do this before the interval creation
    // Si l'interval est une dispo pour un élève, on ne le coupe pas
    // if (interval.kind == "p") {
    //     return [interval];
    // }

    // TUI Calendar uses TZDate for start and end, so we need to either convert them to
    // moment objects, or refactor following code.
    const start = moment.isMoment(interval.start)
        ? interval.start
        : moment(interval.start.toDate());
    const end = moment.isMoment(interval.end)
        ? interval.end
        : moment(interval.end.toDate());

    // si l'interval dure 1h30, on ne le découpe pas
    if (end.diff(start) == 5400000 || end.diff(start) == 1800000) {
        return [interval];
    }

    const newInterval = {
        ...interval,
        start: start.clone(),
        end: start.clone().add(1, "hour"),
    };

    const restInterval = {
        ...interval,
        start: start.clone().add(1, "hour"),
        end,
    };

    // Si le nouvel interval d'une heure à la même heure de fin que l'original, on a fini le travail
    let intervals = [];
    if (newInterval.end.isSame(restInterval.end)) {
        intervals = [newInterval];
    } else {
        const rest = cutInterval(restInterval);
        intervals = [newInterval, ...rest];
    }

    return intervals;
};

export const computeInterval = (intervals, filter) => {
    // Helper function to get the total duration of all intervals
    return intervals
        .filter(filter || (() => true))
        .map(interval => {
            const start = moment(interval.start);
            const end = moment(interval.end);
            return moment.duration(end.diff(start));
        })
        .reduce((total, duration) => total.add(duration), moment.duration());
};

export const computeValidatedInterval = intervals => {
    return this.computeInterval(intervals, i => i.is_validated);
};

const isTZDate = date => {
    return !_.isString(date) && !moment.isMoment(date) && !_.isDate(date);
};

// Convert Ruby DateTime into moment object for easier manipulation
export const momentify = timeIntervals => {
    return _.map(timeIntervals, timeInterval => {
        const newInterval = {
            ...timeInterval,
            start: isTZDate(timeInterval.start)
                ? timeInterval.start.toDate()
                : moment(timeInterval.start),
            end: isTZDate(timeInterval.end)
                ? timeInterval.end.toDate()
                : moment(timeInterval.end),
        };
        return newInterval;
    });
};
