import React from "react";
import { array, func, number } from "prop-types";
import _ from "lodash";
import Select from "react-select";
import { reactOptionMapper } from "../utils";

//------------------
// Utility functions
/**
 * Find all teachers having the given activities
 * @param {Array} elements
 * @param {string} mode
 * @param {Array} activities
 */
const findElementsByActivities = (elements, mode, activities) => {
    const planningIds = [];
    const activityRefIds = activities.map(act => act.id);

    let activitiesKey = null;
    let idFn = x => x.id;

    switch(mode) {
        case "room":
            activitiesKey = "room_activities";
            break;
        case "teacher":
            activitiesKey = "teachers_activity_refs";
            idFn = x => x.planning.id;
            break;
    }

    for (let elt of elements) {
        if (Array.isArray(elt[activitiesKey])) {
            const elementActivityRefIds = elt[activitiesKey].map(
                act => act.activity_ref_id
            );

            for (let id of activityRefIds) {
                if (elementActivityRefIds.includes(id)) {
                    planningIds.push(idFn(elt));
                    break;
                }
            }
        }
    }

    return planningIds;
};

/**
 * Format options for activities selections
 * @param {*} teachers 
 * @param {*} activities 
 */
const formatOptions = (elements, activities, mode) => {
    let activitiesKey = null;

    switch(mode) {
        case "room":
            activitiesKey = "room_activities";
            break;
        case "teacher":
            activitiesKey = "teachers_activity_refs";
            break;
    }

    return Array.isArray(elements) && Array.isArray(activities)
        ? elements
              .reduce((acc, elt) => {
                  // Check if element has activity refs
                  if (!Array.isArray(elt[activitiesKey])) {
                      return acc.splice();
                  }

                  const options = [];
                  // Foreach activity refs, check if we already pushed the option
                  elt[activitiesKey].forEach(ref => {
                      const activityRef = activities.find(
                          act => ref.activity_ref_id === act.id
                      );

                      if (activityRef) {
                          if (!acc.map(opt => opt.id).includes(activityRef.id)) {
                              options.push({
                                  id: activityRef.id,
                                  value: activityRef.id,
                                  label: activityRef.label,
                              });
                          }
                      }
                  });

                  // Return the list of options
                  return acc.concat(options);
              }, [])
        : [];
}

const SELECT_STYLES = {
    container: p => ({
        ...p,
        flex: "auto",
    })
};

//----------------
// REACT COMPONENT
class SelectActivity extends React.Component {
    constructor(props) {
        super(props);

        let elements = [];

        switch(props.mode) {
            case "room":
                elements = props.rooms;
                break;
            case "teacher":
                elements = props.teachers;
                break;
        }

        this.state = {
            elements,
            options: formatOptions(elements, props.activities, props.mode),
            values: [],
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.lastReinitialize !== this.props.lastReinitialize) {
            this.setState({ values: [] });
        }
    }

    // Only for room planning
    handleChangeLocation(locationValue) {
        const { mode, rooms, onChange, defaultPlanning } = this.props;
        const { values } = this.state;

        let elements = rooms;

        if(_.get(locationValue, "value"))
            elements = rooms.filter(e => e.location_id === parseInt(locationValue.value));

        if(values.length > 0)
            onChange(_.uniq([defaultPlanning, ...findElementsByActivities(elements, mode, values)]));

        this.setState({
            elements
        });
    }

    handleSelect = selectedActivities => {
        const { mode, defaultPlanning, onChange } = this.props;
        const { elements } = this.state;

        this.setState({ values: selectedActivities });

        if (selectedActivities.length === 0) {
            onChange([defaultPlanning]);
        } else {
            onChange(_.uniq([defaultPlanning, ...findElementsByActivities(elements, mode, selectedActivities)]));
        }
    };

    render() {
        const { mode, locations } = this.props;
        const { options, values } = this.state;

        return <div>
            <h3>Autres Activités à afficher</h3>
            <div className="flex flex-center-aligned" style={{ minWidth: "400px" }}>
                {mode === "room" && <Select
                    placeholder="Tous les emplacements"
                    isClearable
                    onChange={v => this.handleChangeLocation(v)}
                    options={locations.map(reactOptionMapper())}
                    className="m-r-sm"
                    styles={SELECT_STYLES} />}
                <Select
                    isMulti
                    isClearable
                    hideSelectedOptions
                    options={options}
                    value={values}
                    styles={SELECT_STYLES}
                    onChange={this.handleSelect} />
            </div>
        </div>;
    }
}

//----------
// PROPTYPES
SelectActivity.propTypes = {
    defaultPlanning: number,
    lastReinitialize: number,
    teachers: array,
    activities: array,
    onChange: func,
};

export default SelectActivity;
