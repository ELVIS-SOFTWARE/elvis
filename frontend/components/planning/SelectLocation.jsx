import React from "react";
import { array, func, number } from "prop-types";
import _ from "lodash";
import Select from "react-select";

//------------------
// Utility functions
/**
 * Find all teachers having the given activities
 * @param {object} datasets
 * @param {string}
 * @param {Array} locations
 */
const findElementsByLocation = ({ rooms }, mode, locations) => {
    const planningIds = [];
    const locationsIds = _.map(locations, "id");

    let elements = [];
    let locationKey = null;
    let idFn = x => x.id;

    switch (mode) {
        case "room":
            elements = rooms;
            locationKey = "location_id";
            break;
    }

    for (let elt of elements) {
        if (Boolean(elt[locationKey])) {
            const elementLocationId = elt[locationKey];

            for (let id of locationsIds) {
                if (elementLocationId === id) {
                    planningIds.push(idFn(elt));
                    break;
                }
            }
        }
    }

    return planningIds;
};

/**
 * Format options for locations selections 
 */
const formatOptions = ({ rooms }, locations, mode) => {
    let elements = null;
    let locationKey = null;

    switch (mode) {
        case "room":
            elements = rooms;
            locationKey = "location_id";
            break;
    }

    return Array.isArray(elements) && Array.isArray(locations)
        ? elements
            .reduce((acc, elt) => {
                // Check if element has activity refs
                if (!Boolean(elt[locationKey])) {
                    return acc.splice();
                }

                const options = [];

                const location = locations.find(
                    act => elt[locationKey] === act.id
                );

                if (location) {
                    if (!acc.map(opt => opt.id).includes(location.id)) {
                        options.push({
                            id: location.id,
                            value: location.id,
                            label: location.label,
                        });
                    }
                }

                // Return the list of options
                return acc.concat(options);
            }, [])
        : [];
}

//----------------
// REACT COMPONENT
class SelectLocation extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            options: formatOptions({ rooms: props.rooms }, props.locations, props.mode),
            values: [],
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.lastReinitialize !== this.props.lastReinitialize) {
            this.setState({ values: [] });
        }
    }

    handleSelect = selectedLocations => {
        const { rooms, mode, defaultPlanning, onChange } = this.props;

        this.setState({ values: selectedLocations });

        if (selectedLocations.length === 0) {
            onChange([defaultPlanning]);
        } else {
            onChange(_.uniq([defaultPlanning, ...findElementsByLocation({ rooms }, mode, selectedLocations)]));
        }
    };

    render() {
        const { options, values } = this.state;

        return (
            <Select
                isMulti
                isClearable
                hideSelectedOptions
                options={options}
                value={values}
                onChange={this.handleSelect}
            />
        );
    }
}

//----------
// PROPTYPES
SelectLocation.propTypes = {
    defaultPlanning: number,
    lastReinitialize: number,
    rooms: array,
    activities: array,
    onChange: func,
};

export default SelectLocation;
