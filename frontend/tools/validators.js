import moment from "moment";
import { MESSAGES } from "./constants";

// Utils
export const isEmpty = value =>
    !value ||
    (value.hasOwnProperty("length") && value.length === 0) ||
    (!value.length && !value);

export const composeValidators = (...validators) => (value, values, meta) => {
    return validators.reduce(
        (error, validator) => error || validator(value, values, meta),
        undefined
    );
};

// Check functions

export const isValidEmail = value => {
    const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return regex.test(value) ? undefined : "err_invalid_email"
}

export const minLength = length => value =>{
    if( value == null) return undefined
    return value.length >= length ? undefined : MESSAGES["err_min_length"](length)
}

export const exactLength = length => value =>{
    if( value == null) return undefined
    return value.length == length ? undefined : MESSAGES["err_exact_length"](length)
}

export const startsWith = str => value =>{
    if( value == null) return undefined
    return value.startsWith(str) ? undefined : MESSAGES["err_starts_with"](length)
}

export const isValidAge = value =>{
    const enteredDate = moment(value);
    const maxDate = moment();
    
    return enteredDate.isSameOrBefore(maxDate, "day") ? undefined : "err_invalid_age";
}

// NN : Numéro de registre national belge
export const isValidNN = value => {
    if (value == null) return undefined

    const regex = /^[0-9]{11}$/

    // Remove " " from input mask for validation
    return regex.test(value.replaceAll(" ", "")) ? undefined : "err_invalid_NN"
}

export const required = value =>
    !value || isEmpty(value) ? "err_required" : undefined;

export const ordCheck = (b, ord, formatB = x => x) => a => {
    switch(ord) {
        case "gt":
            return a <= b ? MESSAGES["err_ord_gt"](formatB(b)) : "";
        case "lt":
            return a >= b ? MESSAGES["err_ord_lt"](formatB(b)) : "";
        case "gte":
            return a < b ? MESSAGES["err_ord_gte"](formatB(b)) : "";
        case "lte":
            return a > b ? MESSAGES["err_ord_lte"](formatB(b)) : "";
    }
}

export const isPostalCode = value =>
    /([0-9]{4,5})/.test(value) ? undefined : "err_postal_code";

export const isPhoneNumber = value =>
    /([0-9]{10})/.test(value.replace(/\s/gi, ""))
        ? undefined
        : "err_phone_format";

export const agreement = clause => value =>
    !value ? `err_agreement_${clause}` : undefined;

export const validate = (value, checkFuncs) => {
    if (typeof checkFuncs === "function") {
        return checkFuncs(value);
    }

    if (Array.isArray(checkFuncs)) {
        for (let checkFunc of checkFuncs) {
            const err = checkFunc(value);

            if (err) {
                return err;
            }
        }

        return undefined;
    }

    throw new Error("Not a validator");
};

export const isNumber = value => ((value!==undefined && isNaN(value)) ? 'doit être un nombre' : undefined)
export const isInteger = value => (!Number.isInteger(Number(value)) ? 'doit être un entier' : undefined)
export const isIntegerOrUndefined = value => ((value!==undefined && !Number.isInteger(Number(value))) ? 'doit être un entier' : undefined)
export const minValue = min => value =>
     isNaN(value) || value >= min ? undefined : `doit être supérieur à ${min}`
export const maxValue = max => value =>
    isNaN(value) || value <= max ? undefined : `doit être inférieur à ${max}`

// Functions
export const validateAddress = address => {
    const errors = [
        validate(address.street_address, required),
        validate(address.postcode, [required, isPostalCode]),
        validate(address.city, required),
    ].filter(err => err !== undefined);

    return errors.length === 0 ? undefined : errors;
};

export const validatePhone = phoneNumber => {
    const errors = [validate(phoneNumber, [required, isPhoneNumber])].filter(
        err => err !== undefined
    );

    return errors.length === 0 ? undefined : errors;
};

export const validateAddresses = addresses => {
    const checkEmpty = required(addresses);
    if (checkEmpty) {
        return checkEmpty;
    }

    for (let addr of addresses) {
        const errors = validateAddress(addr);
        if (errors) {
            return errors;
        }
    }

    return undefined;
};

export const validatePhones = phones => {
    const checkEmpty = required(phones);
    if (checkEmpty) {
        return checkEmpty;
    }

    for (let phone of phones) {
        const errors = validatePhone(phone.number);
        if (errors) {
            return errors;
        }
    }

    return undefined;
};
