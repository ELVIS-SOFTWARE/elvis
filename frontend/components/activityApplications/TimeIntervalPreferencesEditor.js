import React from "react";
import { toHourMin, toDate } from "../../tools/format";
import ItemPreferences from "./ItemPreferences";

class Availability extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = { selected: this.props.selected || false };
    }

    handleCheck() {
        const selected = !this.state.selected;
        this.setState({ selected });

        this.props.onSelect(this.props.data, selected);
    }

    render() {
        const { data, selectable, intervalHeader = () => "" } = this.props;
        const { selected } = this.state;
        // Optional location information
        const location = _.get(data, "activity.location.label");
        const teacher = _.get(data, "activity.teacher");

        return (
            <div
                className={`flex flex-column w-100 p-sm mt-2 ${
                    selected ? "bg-primary" : "bg-muted"
                }`}
            >
                <div className="d-flex">
                    <div style={{width: "40%"}}>
                        <div className="font-bold">{intervalHeader(data)}</div>
                        <div>
                        <span
                            className="m-r-sm"
                            style={{ display: "inline-block" }}
                        >
                            <input
                                type="checkbox"
                                checked={selected}
                                disabled={!selectable && !selected}
                                onChange={() => this.handleCheck()}
                            />
                        </span>
                            <span className="font-weight-bold">{toHourMin(toDate(data.start))}</span>{" "}
                            <i className="fas fa-angle-right" />{" "}
                            <span className="font-weight-bold">{toHourMin(toDate(data.end))}</span>
                        </div>
                        {
                            // Optionnaly display location info
                            location && <div>
                            <span className={`badge badge-${selected ? "white" : "secondary"} ml-4`}>
                                {location}
                            </span>
                            </div>
                        }
                    </div>

                    <div style={{width: "60%"}} className="d-flex align-items-center">
                        <div>
                            {data.avatar_url ?
                                <img src={data.avatar_url} className="img-circle no-margin no-padding" alt="image professeur"
                                     style={{width: "32px", height: "32px"}}
                                />
                                :
                                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-circle">
                                    <rect x="0.5" y="0.5" width="31" height="31" rx="15.5" fill="#00334A"/>
                                    <rect x="0.5" y="0.5" width="31" height="31" rx="15.5" fill="black" fillOpacity="0.2"/>
                                    <rect x="0.5" y="0.5" width="31" height="31" rx="15.5" stroke="#86D69E"/>
                                    <mask id="mask0_2159_3919" style={{maskType: "luminance", maskUnits: "userSpaceOnUse", x: "7", y: "6", width: "18", height: "18"}}>
                                        <path d="M16 13.2222C16.4086 13.2222 16.8131 13.1418 17.1906 12.9854C17.568 12.8291 17.911 12.5999 18.1999 12.311C18.4888 12.0221 18.7179 11.6791 18.8743 11.3017C19.0306 10.9242 19.1111 10.5197 19.1111 10.1111C19.1111 9.70255 19.0306 9.298 18.8743 8.92054C18.7179 8.54308 18.4888 8.20012 18.1999 7.91122C17.911 7.62233 17.568 7.39317 17.1906 7.23682C16.8131 7.08047 16.4086 7 16 7C15.1749 7 14.3836 7.32778 13.8001 7.91122C13.2167 8.49467 12.8889 9.28599 12.8889 10.1111C12.8889 10.9362 13.2167 11.7276 13.8001 12.311C14.3836 12.8944 15.1749 13.2222 16 13.2222ZM8 22.4667V23H24V22.4667C24 20.4756 24 19.48 23.6124 18.7191C23.2716 18.0501 22.7277 17.5062 22.0587 17.1653C21.2978 16.7778 20.3022 16.7778 18.3111 16.7778H13.6889C11.6978 16.7778 10.7022 16.7778 9.94133 17.1653C9.27234 17.5062 8.72843 18.0501 8.38756 18.7191C8 19.48 8 20.4756 8 22.4667Z" fill="#555555" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
                                    </mask>
                                    <g mask="url(#mask0_2159_3919)">
                                        <path d="M5.3335 4.33325H26.6668V25.6666H5.3335V4.33325Z" fill="#FF6066"/>
                                    </g>
                                </svg>
                            }

                        </div>
                        <div className="ml-3">
                            <div>Avec</div>
                            <div className="font-weight-bold">{teacher.first_name} {teacher.last_name}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

class IntervalsGroup extends React.PureComponent {
    constructor(props) {
        super(props);
    }

    render() {
        const {
            group,
            groupNameAccessor,
            intervalHeader,
            maxIntervals,
            availabilities,
            selectedIntervals,
            onSelect,
        } = this.props;

        return (
            <div>
                <div className="font-bold p-h-sm">
                    {groupNameAccessor(group)}
                </div>
                <div className="flex flex-wrap">
                    {availabilities.map((availability, i) => (
                        <Availability
                            data={availability}
                            intervalHeader={intervalHeader}
                            selected={selectedIntervals
                                .map(interval => interval.id)
                                .includes(availability.id)}
                            selectable={
                                !maxIntervals ||
                                selectedIntervals.length < maxIntervals
                            }
                            onSelect={onSelect}
                            key={i}
                        />
                    ))}
                </div>
            </div>
        );
    }
}

export default function PreferencesEditor({
    intervals,
    maxIntervals = 0,
    intervalHeader,
    selectedIntervals,
    groupNameAccessor,
    handleSelectInterval,
    handleUp,
    handleDown,
}) {
    return (
        <div className="row">
            <div className="col-md-7 border-right m-b-sm">
                <h4>{"Créneaux disponibles"}</h4>
                {Object.keys(intervals).map(group => (
                    <IntervalsGroup
                        group={group}
                        intervalHeader={intervalHeader}
                        groupNameAccessor={groupNameAccessor}
                        maxIntervals={maxIntervals}
                        availabilities={intervals[group]}
                        key={group}
                        selectedIntervals={selectedIntervals}
                        onSelect={handleSelectInterval}
                    />
                ))}
            </div>

            <div className="col-md-5">
                <h4>
                    {maxIntervals === 1
                        ? "Créneau choisi"
                        : "Ordre de préférences"}
                </h4>
                {selectedIntervals.length > 0 ? (
                    <ItemPreferences
                        sortable={maxIntervals !== 1}
                        showDate={maxIntervals === 1}
                        items={selectedIntervals}
                        onUp={handleUp}
                        onDown={handleDown}
                    />
                ) : (
                    <p>{"Aucun créneau ne me convient."}</p>
                )}
            </div>
        </div>
    );
}
