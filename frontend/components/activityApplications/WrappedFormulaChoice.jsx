import React from "react";
import {toast} from "react-toastify";
import FormulaChoice from "./FormulaChoice";


class WrappedFormulaChoice extends React.Component {
    constructor(props) {
        super(props);
    }

    isValidated() {

        return true;
    }

    render() {
        console.log("Props passées à FormulaChoice :", this.props);
        return (
            <FormulaChoice
                {...this.props}
            />
        );
    }
}

export default WrappedFormulaChoice;