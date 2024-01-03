export const NON_EMPTY = s => s.length > 0;

export const MATCHES_PATTERN = function(p) {
    if (Object.getPrototypeOf(p) === RegExp.prototype) {
        return s => p.test(s);
    } else {
        throw new TypeError("Parameter must be of type RegExp");
    }
};

export const INTEGER = MATCHES_PATTERN(/^[-+]?\d+$/);

export const EMAIL = MATCHES_PATTERN(
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
);

export const DATE = MATCHES_PATTERN(/^\d+-\d{2}-\d{2}$/);

export const SEX = s => s === 'M' || s === 'F' || s === 'A';