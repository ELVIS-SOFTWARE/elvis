export default class Validator {
    constructor() {
        this.checkers = [];
        this.value = null;
    }

    checker(checker) {
        if (Object.getPrototypeOf(checker) === Function.prototype)
            return Object.assign(new Validator(), {
                ...this,
                checkers: [...this.checkers, checker],
            });
        else throw new TypeError("Checker must be a function");
    }

    setValue(v) {
        if (Object.getPrototypeOf(v) === String.prototype)
            return Object.assign(new Validator(), {
                ...this,
                value: v,
            });
        else throw new TypeError("Value must be of type String");
    }

    validate() {
        for (const checker of this.checkers)
            if (!checker(this.value)) return false;

        return true;
    }
}
