import React from "react";
import InputSelect from "../common/InputSelect";
import { toast } from "react-toastify";
import { MESSAGES } from "../../tools/constants";
import * as api from "../../tools/api.js";
import AddCourseSummary from "./AddCourseSummary";

export default class AddLocationForCourse extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            roomId: this.props.initialValues.roomId,
            locationId: this.props.initialValues.locationId,
            rooms: undefined,
            locationOptions: undefined,
            roomsOptions: undefined,
            href_path: this.props.href_path,
            summary: this.props.summary,
        };
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
        api.get(`/locations`).then(({ data, error }) => {
            if (error) {
                console.log(error);
            } else {
                const locationOptions = data.map(location => ({ label: location.label, value: location.id }));

                this.setState({
                    ...this.state,
                    locationOptions: locationOptions,
                    locationId: this.state.locationId || ((data || []).at(0) || {}).id
                });

                this.handleChange({locationId: this.state.locationId})
            }
        });

        const {
            fromDate,
            toDate,
            firstDayStartTime,
            firstDayEndTime,
            activityRefId,
        } = this.props.initialValues;
        api.get(
            `/rooms/index_with_overlap?fromDate=${fromDate}&toDate=${toDate}&startTime=${firstDayStartTime}&endTime=${firstDayEndTime}&activityRefId=${activityRefId}`
        ).then(({ data, error }) => {
            if (error) {
                console.log(error);
            } else {
                this.setState({
                    ...this.state,
                    rooms: data,
                    roomsOptions: data.map(room => ({ label: room.label, value: room.id })),
                    roomId: this.state.roomId || ((data || []).at(0) || {}).id
                });

                this.handleChange({roomId: this.state.roomId, locationId: this.state.locationId})
            }
        });
    }

    handleChange(newValues) {
        const update = { ...this.state, ...newValues };

        let selectedRoom;
        if (this.state.rooms && update.roomId) {
            selectedRoom = this.state.rooms.find(room => update.roomId === room.id);

        }

        let selectedLocation;
        if (this.state.locationOptions && update.locationId) {
            selectedLocation = this.state.locationOptions.find(
                location => location.value === update.locationId
            );
        }

        update.summary = {
            ...update.summary,
            location: selectedLocation ? selectedLocation.label : undefined,
            room: selectedRoom ? selectedRoom.label : undefined,
        };

        this.setState(update);

        this.props.onChange({
            room: {
                id: (selectedRoom || {}).id,
                label: (selectedRoom || {}).label,
            },
            location: {
                id: (selectedLocation || {}).value,
                label: (selectedLocation || {}).label,
            },
            summary: { ...update.summary },
        });
    }

    isValidated() {
        if (!this.state.roomId) {
            toast.error(MESSAGES.err_must_choose_room, { autoClose: 3000 });
            return false;
        }
        return true;
    }

    render() {
        const {
            roomId,
            locationId,
            rooms,
            locationOptions,
            roomsOptions,
            href_path,
            summary,
        } = this.state;
        return (
            <div className="row">
                <div className="col-md-8">
                    <div className="ibox">
                        <div className="ibox-title flex">
                            <i className="fa fa-map-marker m-sm"></i>
                            <h3>Choix du lieu</h3>
                        </div>
                        <div className="ibox-content">
                            <div className="row">
                                <div className="col-md-6">
                                    {locationOptions && (
                                        <InputSelect
                                            input={{
                                                name: "location",
                                                onChange: e => {
                                                    let newOptions = [];

                                                    if (
                                                        e.target.value.length ==
                                                        0
                                                    ) {
                                                        newOptions = rooms.map(
                                                            room => {
                                                                return {
                                                                    label:
                                                                        room.label,
                                                                    value:
                                                                        room.id,
                                                                };
                                                            }
                                                        );
                                                    } else {
                                                        newOptions = rooms
                                                            .filter(
                                                                room =>
                                                                    room.location_id ==
                                                                    e.target
                                                                        .value
                                                            )
                                                            .map(room => {
                                                                return {
                                                                    value:
                                                                        room.id,
                                                                    label:
                                                                        room.label,
                                                                };
                                                            });
                                                    }

                                                    const roomsAvailable =
                                                        newOptions.length > 0 &&
                                                        e.target.value.length >
                                                            0;

                                                    this.handleChange({
                                                        roomsOptions: newOptions,
                                                        locationId:
                                                            e.target.value,
                                                        roomId: roomsAvailable
                                                            ? newOptions[0]
                                                                  .value
                                                            : "",
                                                    });
                                                },
                                                value: locationId,
                                            }}
                                            meta={{}}
                                            label="Filtrer par site"
                                            options={locationOptions}
                                            button={{
                                                icon: "fa fa-plus-circle",
                                                href_path: `${href_path}/locations/new`,
                                                text: "",
                                                tooltip: "Ajouter un lieu",
                                            }}
                                        />
                                    )}

                                    {roomsOptions && (
                                        <InputSelect
                                            input={{
                                                name: "room",
                                                onChange: e =>
                                                    this.handleChange({
                                                        roomId: parseInt(e.target.value),
                                                    }),
                                                value: roomId,
                                            }}
                                            meta={{}}
                                            label="Salle"
                                            required={true}
                                            options={roomsOptions}
                                            button={{
                                                icon: "fa fa-plus-circle",
                                                href_path: `${href_path}/rooms/new`,
                                                text: "",
                                                tooltip: "Ajouter une salle",
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <AddCourseSummary
                        summary={summary}
                        handleSubmit={this.handleSubmit}
                    />
                </div>
                <button className="btn btn-primary btn-md submit-activity">
                    {"Valider"}
                </button>
            </div>
        );
    }
}
