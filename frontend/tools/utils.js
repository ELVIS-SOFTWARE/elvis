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