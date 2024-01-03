import { toHourMin, toLocaleDate } from "./format";
import { WEEKDAYS, TIME_STEPS } from "./constants";

export const getNextWeekWithoutSunday = date => {
    const week = [];

    for (let i = 0; i < WEEKDAYS.length; i++) {
        const value = new Date();
        value.setFullYear(date.getFullYear());
        value.setMonth(date.getMonth());
        value.setDate(date.getDate() + i);

        if (value.getDay() === 0) {
            continue;
        }

        week.push({
            weekday: WEEKDAYS[value.getDay()],
            day: value.getDay(),
            value: value.toISOString(),
            fullday: `${WEEKDAYS[value.getDay()]} ${toLocaleDate(value)}`
        });
    }

    return week;
};

export const checkStartEndTime = (start, end) => {
    // Get parsed Values
    const parsedStart = start.split(":").map(i => parseInt(i));
    const parsedEnd = end.split(":").map(i => parseInt(i));

    // Use date object to compare time
    const startMinutes =  parsedStart[0] * 60 + parsedStart[1];
    const endMinutes = parsedEnd[0] * 60 + parsedEnd[1];

    // check start/end
    return startMinutes < endMinutes;
};

export const adjustStartEndTime = (start, end, inputName) => {
    // Get parsed Values
    const parsedStart = start.split(":").map(i => parseInt(i));
    const parsedEnd = end.split(":").map(i => parseInt(i));
    const steps = TIME_STEPS.map(ts => ts.value);

    const checkMinutes = minutes => steps.includes(minutes / 60);

    // Use date object to compare time
    const dateStart = new Date();
    dateStart.setHours(parsedStart[0], checkMinutes(parsedStart[1]) ? parsedStart[1] : 0);

    const dateEnd = new Date();
    dateEnd.setHours(parsedEnd[0], checkMinutes(parsedEnd[1]) ? parsedEnd[1] : 0);

    // Adjust start/end
    if (dateStart >= dateEnd) {
        if (inputName === "start") {
            dateEnd.setHours(dateStart.getHours() + 1);
        } else {
            dateStart.setHours(dateEnd.getHours() - 1);
        }
    }

    return { start: toHourMin(dateStart), end: toHourMin(dateEnd) };
};

export const segmentInterval = (start, end, step) => {
    const intervals = [];

    const intervalCount = Math.floor(
        (end.getHours() - start.getHours()) / step
    );

    for (let i = 0; i < intervalCount; i++) {
        const startDate = new Date(start.toISOString());

        if (step <= 0.75) {
            startDate.setHours(startDate.getHours(), startDate.getMinutes() + (i * (60 * step)));
        } else {
            startDate.setHours(startDate.getHours() + i);
        }

        const endDate = new Date(start.toISOString());

        if (step <= 0.75) {
            endDate.setHours(startDate.getHours(), startDate.getMinutes() + (60 * step));
        } else {
            endDate.setHours(startDate.getHours() + 1);
        }

        intervals.push({
            start: startDate.toISOString(),
            end: endDate.toISOString(),
        });
    }

    return intervals;
};