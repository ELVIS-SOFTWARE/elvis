import React from "react";
import { oneOfType, array, string } from "prop-types";
import { MESSAGES } from "../../tools/constants";
import ErrorList from "./ErrorList";

class ValidationErrorList extends React.PureComponent {
    constructor(props) {
        super(props);
    }

    render() {
        const { error } = this.props;

        if (!error) {
            return null;
        }

        if (Array.isArray(error)) {
            return <ErrorList errors={error.map(err => MESSAGES[err])} />
        }

        return <ErrorList errors={[MESSAGES[error]]} />;
    }
}

ValidationErrorList.propTypes = {
    error: oneOfType([string, array]),
};

export default ValidationErrorList;