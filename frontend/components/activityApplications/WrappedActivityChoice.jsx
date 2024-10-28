import React from "react";
import ActivityChoice from "./ActivityChoice";
import {toast} from "react-toastify";


class WrappedActivityChoice extends React.Component {
    constructor(props) {
        super(props);

    }

    isValidated() {
        const {selectedActivities, selectedPacks} = this.props;

        if (selectedActivities.length === 0 && Object.keys(selectedPacks).length === 0) {
            toast.error("Vous devez choisir au moins une activité ou un pack", {autoClose: 3000});
            return false;
        }

        return true;
    }


    render() {
        return (
            <ActivityChoice
                {...this.props}
            />
        );
    }

}

export default WrappedActivityChoice;