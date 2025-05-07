export function calculateAge(birthday) {
    const today = new Date();
    const birthDate = new Date(birthday);
    const millisecondsPerYear = 1000 * 60 * 60 * 24 * 365.25;
    return (today - birthDate) / millisecondsPerYear;
}

export function birthdayIsUnder18(birthday) {
    return calculateAge(birthday) < 18;
}

/**
 *
 * @param {{birthday: Date|string}} user
 * @returns {boolean}
 * @constructor
 */
export function userIsMinor(user) {
    return user.birthday && birthdayIsUnder18(user.birthday);
}

export function getActivityColor(activity) {
    const ACTIVITY_KIND_COLORS = {
        Enfance: "#FFC314",
        CHAM: "#5A676F",
        ATELIERS: "#FF9846",
        DEFAULT: "#E96469",
    };

    const kind = activity?.activity_ref?.kind;
    const customColor = activity?.activity_ref?.color_code;
    const defaultColor = ACTIVITY_KIND_COLORS[kind] || ACTIVITY_KIND_COLORS.DEFAULT;

    return customColor || defaultColor;
}