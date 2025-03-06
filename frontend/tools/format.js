import moment from "moment";
import { retrieveUserLevel } from "./obj";
import React from "react";
import {findAndGet, ISO_DATE_FORMAT} from "../components/utils";
import { WEEKDAYS } from "./constants";

export const twoDigits = n => (n < 10 ? `0${n}` : `${n}`);

export const validateEmail = (email) => {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};

export const toRawPhoneNumber = value => value.replace(/\s/gi, "");
export const prettifyPhoneNumber = value =>
    value
        ? value.replace(
            /(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/gi,
            "$1 $2 $3 $4 $5"
        )
        : "";

export const toBirthday = value => (value ? value.split("T")[0] : "");

export const toLocaleDate = date =>
    date.toLocaleString("fr-FR", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
    });

export const toMonthName = month => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(parseInt(month, 10) - 1);
    return date.toLocaleString("fr-FR", { month: "long" });
};

export const toTimeRange = obj => {
    const from = toDate(obj.start);
    const to = toDate(obj.end);

    const options = {
        hour: "numeric",
        minute: "numeric",
    };

    return `Le ${toLocaleDate(from)} de ${from.toLocaleString(
        "fr-FR",
        options
    )} à ${to.toLocaleString("fr-FR", options)}`;
};

export const toDateStr = date =>
    `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

export const toHourMin = date =>
    `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`;

export const toDate = datestr => new Date(datestr);

export const timeToDate = (timestr, refDate = null) => {
    const date = new Date();
    const parsedTimeStr = timestr.split(":");

    date.setHours(parseInt(parsedTimeStr[0]), parseInt(parsedTimeStr[1]), 0, 0);

    if (refDate) {
        const refDateObj =
            typeof refDate === "string" ? toDate(refDate) : refDate;
        date.setFullYear(refDateObj.getFullYear());
        date.setMonth(refDateObj.getMonth());
        date.setDate(refDateObj.getDate());
    }

    return date;
};

export const toFullDateFr = date => {
    const tmpDate = new Date(date);

    return `${WEEKDAYS[tmpDate.getDay()]} ${tmpDate.getDate()} ${toMonthName(tmpDate.getMonth())} ${tmpDate.getFullYear()}`;
}

export const fullname = user =>
    `${(user.last_name || "").toUpperCase()} ${user.first_name}`;

export const fullnameWithAge = user =>
    `${fullname(user)}, ${moment().diff(user.birthday, "years")} ans`;

export const displayLevel = (user, activityRefId, seasonId) => {
    const level = retrieveUserLevel(user, activityRefId, seasonId);
    return (level && `Niveau ${level}`) || "PAS DE NIVEAU";
};

export const fullnameWithAgeAndLevel = (user, activityRefId, seasonId) => {
    const level = retrieveUserLevel(user, activityRefId, seasonId);
    return `${fullnameWithAge(user)}${level ? `, niveau ${level}` : ""}`;
};

export const toAge = birthday =>
    moment().diff(birthday, "years") > 0
        ? `${moment().diff(birthday, "years")} ans`
        : `${moment().diff(birthday, "months")} mois`;

export function formatActivityForDisplay(activity) {
    const ref = activity.activity_ref.label;
    const startTime = moment(activity.time_interval.start).format("HH:mm");
    const endTime = moment(activity.time_interval.end).format("HH:mm");
    const wday = new Intl.DateTimeFormat("fr", { weekday: "long" }).format(
        new Date(activity.time_interval.start)
    );

    return `${activity.group_name} ${ref} (${wday} de ${startTime} à ${endTime})`;
}

export function capitalFirstLetters(s) {
    if(!s)
        return "";

    const r = /\b\w/g;
    let res = "";
    let m;

    while((m = r.exec(s)) !== null) {
        res += m[0].toUpperCase();
    }

    return res;
}

export const formatIntervalHours = interval =>
    `${toHourMin(toDate(interval.start))} - ${toHourMin(
        toDate(interval.end)
    )}`;

export const displayActivityRef = ref => ref.activity_type === "child" ? ref.label : ref.kind;

export const occupationInfos = (activity, referenceDate = undefined) => {
    let headCount, validatedHeadCount, headCountLimit = 0;
    let hasOption = false;

    if(_.get(activity, "activity_ref.is_work_group")) {
        hasOption = _.some(activity.activities_instruments, ai => Boolean(ai.user_id) && !ai.is_validated);
        headCount = activity.activities_instruments.filter(ai => Boolean(ai.user_id)).length;
        headCountLimit = activity.activities_instruments.length;
        validatedHeadCount = headCount;
    }
    else {
        const optionsUserIds = _(activity.options)
            .map("desired_activity.activity_application.user_id")
            .compact()
            .value();

        hasOption = Boolean(optionsUserIds.length);
        // ne pas mettre === car stopped_at et referenceDate peut être undefined ou null ou chaine vide
        const activeUsers = activity.users.filter(u =>
            referenceDate == undefined ||
            (u.begin_at <= referenceDate && (u.stopped_at == undefined || u.stopped_at > referenceDate))
        );

        headCount = activeUsers.length + optionsUserIds.length;
        headCountLimit = activity.activity_ref.occupation_limit;
        validatedHeadCount = activeUsers.length;
    }

    return {headCount, validatedHeadCount, headCountLimit, hasOption};
}

export const formatActivityHeadcount = (activity, referenceDate = undefined) => {
    let { headCount, validatedHeadCount, headCountLimit, hasOption } = occupationInfos(activity, referenceDate);

    const isFull = validatedHeadCount >= headCountLimit;
    const hasNoRole = headCountLimit === 0 && validatedHeadCount === 0;
    const options = headCount - validatedHeadCount;

    let styles = {};
    if (isFull && !hasNoRole) {
        styles = {
            ...styles,
            color: "#d63031",
            fontWeight: "bold",
        };
    }

    if (hasNoRole) {
        return (
            <p style={styles} data-tippy-content="Aucun rôle n'a été ajouté">
                {validatedHeadCount}
                {options > 0 && (
                    <span style={{ color: "#9575CD" }}> + {options}</span>
                )}
                {" / "}
                {headCountLimit}
                <i className="fas fa-info-circle m-l-xs" />
            </p>
        );
    }

    return (
        <p style={styles}>
            {validatedHeadCount}
            {options > 0 && (
                <span style={{ color: "#9575CD" }}> + {options}</span>
            )}
            {" / "}
            {headCountLimit}
            {isFull ? <i className="fas fa-lock m-l-xs" /> : null}
        </p>
    );
};

// export const formatActivityHeadcount = (activity, referenceDate = undefined) => {
//     let headCount, validatedHeadCount, headCountLimit = 0;
//
//     let hasOption = false;
//
//     if(_.get(activity, "activity_ref.is_work_group")) {
//         hasOption =  _.some(activity.activities_instruments, ai => Boolean(ai.user_id) && !ai.is_validated);
//         headCount = activity.activities_instruments.filter(ai => Boolean(ai.user_id)).length;
//         headCountLimit = activity.activities_instruments.length;
//         validatedHeadCount = headCount;
//     }
//     else {
//         const optionsUserIds = _(activity.options)
//             .map("desired_activity.activity_application.user_id")
//             .compact()
//             .value();
//
//         hasOption = Boolean(optionsUserIds.length);
//         headCount = activity.users.filter(u => referenceDate == undefined || u.begin_at <= referenceDate && (u.stopped_at == undefined || u.stopped_at > referenceDate)).length + optionsUserIds.length;
//         headCountLimit = activity.activity_ref.occupation_limit;
//         validatedHeadCount = activity.users.length;
//     }
//
//     const isFull = validatedHeadCount >= headCountLimit;
//
//     let styles = {};
//
//     if (isFull)
//         styles = {
//             ...styles,
//             color: "#d63031",
//             fontWeight: "bold",
//         };
//
//     if (hasOption)
//         styles = {
//             ...styles,
//             color: "#9575CD",
//             fontWeight: "bold",
//         };
//
//     return <p style={styles}>
//         {`${headCount} / ${headCountLimit} `}
//         {isFull ? <i className="fas fa-lock m-l-xs"/> : null}
//     </p>
// };