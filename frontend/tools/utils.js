export function calculateAge(birthday) {
    const today = new Date();
    const birthDate = new Date(birthday);
    const millisecondsPerYear = 1000 * 60 * 60 * 24 * 365.25;
    return (today - birthDate) / millisecondsPerYear;
}

export function userIsMinor(birthday) {
    return calculateAge(birthday) < 18;
}