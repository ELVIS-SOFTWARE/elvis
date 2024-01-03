import Validator from "./validator";

export default class Validation {
    constructor() {
        this.validators = {};
    }

    validator(name, validator) {
        if (
            Object.getPrototypeOf(validator) === Validator.prototype &&
            Object.getPrototypeOf(name) === String.prototype
        )
            return Object.assign(new Validation(), {
                validators: {
                    ...this.validators,
                    [name]: validator,
                },
            });
        else
            throw new TypeError(
                "Function requires a string for the name and a validator object for the validator",
            );
    }

    get(name) {
        return this.validators[name];
    }

    /**
     * Checks its internal validators validation states.
     * Returns if the validation has passed or not, and the
     * wrong validators in the latter case.
     */
    validate() {
        let failed = [];

        for (const [name, validator] of Object.entries(this.validators))
            if (!validator.validate()) failed.push(name);

        return {
            ok: failed.length === 0,
            failed,
        };
    }
}
