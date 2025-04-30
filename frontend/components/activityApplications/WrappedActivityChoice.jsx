import React from "react";
import ActivityChoice from "./ActivityChoice";
import {toast} from "react-toastify";


class WrappedActivityChoice extends React.Component {
    constructor(props) {
        super(props);

    }

    isValidated() {
        const { selectedActivities, selectedFormulas, selectedPacks } = this.props;

        if (Object.keys(selectedFormulas).length === 0 && selectedActivities.length === 0 && Object.keys(selectedPacks).length === 0) {
            toast.error("Vous devez choisir au moins une activité si vous n'avez pas sélectionné de formule", { autoClose: 3000 });
            return false;
        }

        return true;
    }


    render() {
        return (
            <ActivityChoice
                {...this.props}
                selectedFormulaActivities={this.props.selectedFormulaActivities}
            />
        );
    }

}

export default WrappedActivityChoice;