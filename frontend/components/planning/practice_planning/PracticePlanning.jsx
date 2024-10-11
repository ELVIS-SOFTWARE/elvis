import React from "react";
import FullCalendar from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/interaction";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import Modal from "react-modal";
import PracticeMultiViewModal from "./PracticeMultiViewModel";
import PracticeHandleSessions from "./PracticeHandleSessions";
import {csrfToken} from "../../utils";
import * as api from "../../../tools/api";

const moment = require("moment-timezone");
require("moment/locale/fr");

let eventGuid = 0;
let todayStr = new Date().toISOString().replace(/T.*$/, "");

export const RESSOURCES = [
    {
        id: "1", title: "Stax",
        businessHours: [
            {
                startTime: '10:00',
                endTime: '15:00',
                daysOfWeek: [1] // Mon,Wed,Fri
            },
            {
                startTime: '10:00',
                endTime: '12:00',
                daysOfWeek: [2] // Mon,Wed,Fri
            },
            {
                startTime: '10:00',
                endTime: '21:00',
                daysOfWeek: [3] // Mon,Wed,Fri
            },
            {
                startTime: '10:00',
                endTime: '20:00',
                daysOfWeek: [4] // Mon,Wed,Fri
            },
            {
                startTime: '10:00',
                endTime: '12:00',
                daysOfWeek: [5] // Mon,Wed,Fri
            },
            {
                startTime: '14:00',
                endTime: '20:00',
                daysOfWeek: [5] // Mon,Wed,Fri
            },
        ]
    },
    {
        id: "2", title: "Rak",
        businessHours: [
            {
                startTime: '10:00',
                endTime: '15:00',
                daysOfWeek: [1] // Mon,Wed,Fri
            },
            {
                startTime: '10:00',
                endTime: '12:00',
                daysOfWeek: [2] // Mon,Wed,Fri
            },
            {
                startTime: '10:00',
                endTime: '21:00',
                daysOfWeek: [3] // Mon,Wed,Fri
            },
            {
                startTime: '10:00',
                endTime: '20:00',
                daysOfWeek: [4] // Mon,Wed,Fri
            },
            {
                startTime: '10:00',
                endTime: '12:00',
                daysOfWeek: [5] // Mon,Wed,Fri
            },
            {
                startTime: '14:00',
                endTime: '20:00',
                daysOfWeek: [5] // Mon,Wed,Fri
            },
        ]
    },
    {
        id: "3", title: "Sun",
        businessHours: [
            {
                startTime: '10:00',
                endTime: '15:00',
                daysOfWeek: [1] // Mon,Wed,Fri
            },
            {
                startTime: '10:00',
                endTime: '12:00',
                daysOfWeek: [2] // Mon,Wed,Fri
            },
            {
                startTime: '10:00',
                endTime: '21:00',
                daysOfWeek: [3] // Mon,Wed,Fri
            },
            {
                startTime: '10:00',
                endTime: '20:00',
                daysOfWeek: [4] // Mon,Wed,Fri
            },
            {
                startTime: '10:00',
                endTime: '12:00',
                daysOfWeek: [5] // Mon,Wed,Fri
            },
            {
                startTime: '14:00',
                endTime: '20:00',
                daysOfWeek: [5] // Mon,Wed,Fri
            },
        ]
    },
    {
        id: "4",
        title: "Chess",
        businessHours: [
            {
                startTime: '10:00',
                endTime: '15:00',
                daysOfWeek: [1] // Mon,Wed,Fri
            },
            {
                startTime: '10:00',
                endTime: '12:00',
                daysOfWeek: [2] // Mon,Wed,Fri
            },
            {
                startTime: '10:00',
                endTime: '21:00',
                daysOfWeek: [3] // Mon,Wed,Fri
            },
            {
                startTime: '10:00',
                endTime: '20:00',
                daysOfWeek: [4] // Mon,Wed,Fri
            },
            {
                startTime: '10:00',
                endTime: '12:00',
                daysOfWeek: [5] // Mon,Wed,Fri
            },
            {
                startTime: '14:00',
                endTime: '20:00',
                daysOfWeek: [5] // Mon,Wed,Fri
            },
        ]
    },
    {id: "5", title: "Electric Lady"},
    {
        id: "6",
        title: "Motown",
        businessHours: [
            {
                startTime: '10:00',
                endTime: '15:00',
                daysOfWeek: [1] // Mon,Wed,Fri
            },
            {
                startTime: '10:00',
                endTime: '12:00',
                daysOfWeek: [2] // Mon,Wed,Fri
            },
            {
                startTime: '10:00',
                endTime: '21:00',
                daysOfWeek: [3] // Mon,Wed,Fri
            },
            {
                startTime: '10:00',
                endTime: '20:00',
                daysOfWeek: [4] // Mon,Wed,Fri
            },
            {
                startTime: '10:00',
                endTime: '12:00',
                daysOfWeek: [5] // Mon,Wed,Fri
            },
            {
                startTime: '14:00',
                endTime: '20:00',
                daysOfWeek: [5] // Mon,Wed,Fri
            },
        ]
    },
];

export const ROOMS = [
    {id: "1", label: "Stax"},
    {id: "2", label: "Rak"},
    {id: "3", label: "Sun"},
    {id: "4", label: "Chess"},
    {id: "5", label: "Electric Lady"},
    {id: "6", label: "Motown"},
];

export const BANDS = [
    {id: "1", label: "Rolling Stones"},
    {id: "2", label: "Beatles"},
    {id: "3", label: "Led Zeppelin"},
    {id: "4", label: "The Who"},
    {id: "5", label: "Creedence"},
    {id: "6", label: "ZZ Top"},
];

export const INITIAL_EVENTS = [
    {
        id: createEventId(),
        title: "All-day event",
        start: todayStr,
        resourceId: "1",
        backgroundColor: "blue",
        borderColor: "blue"
    },
    {
        id: createEventId(),
        title: "Timed event",
        start: todayStr + "T13:00:00",
        end: todayStr + "T15:00:00",
        resourceId: "2",
        backgroundColor: "blue",
        borderColor: "blue"
    },
    {
        className: 'fc-non-business',
        id: createEventId(),
        title: "Timed event",
        start: todayStr + "T10:00:00",
        end: todayStr + "T11:00:00",
        resourceId: "6",
        display: "background",
        backgroundColor: "blue",
        borderColor: "blue"
    },
    {
        id: createEventId(),
        title: "Timed 2",
        start: todayStr + "T10:00:00",
        end: todayStr + "T12:00:00",
        resourceId: "4",
        backgroundColor: "rgba(74,229,7,0.91)",
        borderColor: "transparent"
    },
    {
        id: createEventId(),
        title: "Timed 2",
        start: todayStr + "T15:00:00",
        end: todayStr + "T18:00:00",
        resourceId: "5",
        backgroundColor: "blue",
        borderColor: "blue"
    },
];

export function createEventId() {
    return String(eventGuid++);
}

export default class PracticePlanning extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            weekendsVisible: true,
            isCreationModalOpen: false,
            isDetailModalOpen: false,
            currentEvents: [],
            bands: props.bands,
            selectedSchedule: {
                resource: {
                    id: ""
                }
            },
            events: this.generateEvents(props.practice_sessions),
            rooms: this.generateRessources(props.rooms),
        };
        this.calendarRef = React.createRef();
    }

    componentDidMount() {
        Modal.setAppElement('body');
        this.state.dateInfo = {
            startStr: this.getDate(),
            endStr: null,
        };
    }

    fetchSessions() {
        let tmp = new URLSearchParams()
        tmp.append("start", this.state.dateInfo.startStr)
        tmp.append("end", this.state.dateInfo.endStr)
        const params = "?" + [...tmp.entries()].map(([k, v]) => `${k}=${v}`).join("&");
        api.set()
            .success((results) => {
                this.setState({events: this.generateEvents(results)})
            })
            .get(`sessions${params}`)
    }

    datesSet(dateInfo) {
        this.state.dateInfo = dateInfo;
        this.fetchSessions();
    }

    handleCreateInterval(state) {
        api.set()
            .post('/practice/sessions', {
                current_user: {id: this.props.curent_user.id},
                band: {id: state.band},
                room: {id: state.room},
                start: state.start,
                stop: state.end,
            })
        let calendarApi = this.state.selectedSchedule.view.calendar;
        calendarApi.unselect();

        calendarApi.addEvent({
            id: createEventId(),
            title: this.displayBandName(state.band),
            start: state.start,
            end: state.end,
            resourceId: state.room,
        });

        location.reload();
    }

    handleUpdateSession(session) {
        api.set()
            .success(data => {
                this.setState({
                    ...this.state,
                    events: this.state.events.map(e => {
                        let tmp = {...e}
                        if (e.id == session.id) {
                            if (session.room)
                                tmp.resourceId = session.room;
                            if (session.band) {
                                tmp.bandId = session.band;
                                tmp.title = this.state.bands.find(b => b.id == session.band).name
                            }
                            if (session.start)
                                tmp.start = session.start;

                            if (session.end)
                                tmp.end = session.end;
                        }

                        return tmp
                    }),
                });
            })
            .patch(`/practice/sessions/${session.id}`, {
                "X-Csrf-Token": csrfToken,
                room: session.room,
                band: session.band,
                start: session.start,
                end: session.end,
            })
    }

    handleDeleteSession(session) {
        api.set()
            .success(() => {
                this.setState({
                    ...this.state,
                    events: this.state.events.filter(e => e.id !== session.id)
                })
            })
            .del(`/practice/sessions/${session.id}`, {
                "X-Csrf-Token": csrfToken,
            })
    }

    closeMultiViewModal() {
        this.setState({isMultiViewModalOpen: false});
    }

    closeHandleSessionsModal() {
        this.setState({isHandleSessionsOpen: false});
    }

    displayBandName(bandId) {
        return this.state.bands.find(band => {
            return band.id === bandId
        }).name
    }

    generateEvents(practice_sessions) {

        return practice_sessions.map(session => {
            return {
                id: session.id,
                title: session.band.name,
                bandId: session.band.id,
                start: session.time_interval.start,
                end: session.time_interval.end,
                resourceId: session.room_id,
                backgroundColor: "blue",
                borderColor: "blue",
            }
        })
    }

    generateRessources(rooms) {
        return rooms.map(room => {
            return {
                id: room.id,
                title: room.label,
            }
        })
    }

    getDate() {
        let calendarApi = this.calendarRef.current.getApi();
        return calendarApi.getDate();
    }

    handleWeekendsToggle = () => {
        this.setState({
            weekendsVisible: !this.state.weekendsVisible,
        });
    };

    handleDateSelect = selectInfo => {
        moment.locale();
        this.setState({
            isMultiViewModalOpen: true,
            selectedSchedule: selectInfo,
            room: selectInfo.resource.id
        });

        let calendarApi = selectInfo.view.calendar;
        calendarApi.unselect(); // clear date selection
    };

    handleEventClick = clickInfo => {
        this.setState({
            isHandleSessionsOpen: true,
            eventSelected: this.state.events.find(e => e.id == clickInfo.event.id),
        })
    };

    handleEvents = events => {
        this.setState({
            currentEvents: events,
        });
    };

    render() {
        return (
            <div className="demo-app">
                <div className="demo-app-main">
                    <FullCalendar
                        ref={this.calendarRef}
                        plugins={[resourceTimelinePlugin, interactionPlugin]}
                        headerToolbar={{
                            left: "prev,next today",
                            center: "title",
                            right: "resourceTimelineDay,resourceTimelineWeek",
                        }}
                        buttonText={{today: "aujourd'hui"}}
                        initialView="resourceTimelineDay"
                        views={{
                            resourceTimelineWeek: {
                                type: "resourceTimelineWeek",
                                duration: {days: 7}
                            }
                        }}
                        locale="fr"
                        // selectConstraint="businessHours"
                        selectable={true}
                        eventLimit={true}
                        aspectRatio={1.5}
                        slotMinTime="10:00:00"
                        slotMaxTime="22:00:00"
                        events={this.state.events} // alternatively, use the `events` setting to fetch from a feed
                        // resourceAreaHeaderContent="Rooms"
                        resourceAreaColumns={[{headerContent: 'Salles'}]}
                        resourceAreaWidth="15%"
                        // initialResources={RESSOURCES}
                        initialResources={this.state.rooms}
                        // nowIndicator={true}
                        select={this.handleDateSelect}
                        selectOverlap={false}
                        eventContent={renderEventContent} // custom render function
                        eventClick={this.handleEventClick}
                        eventsSet={this.handleEvents} // called after events are initialized/added/changed/removed
                        datesSet={(dateInfo) => {
                            this.datesSet(dateInfo)
                        }} // called on date changes
                        //  you can update a remote database when these fire:
                        // eventAdd={function(){}}
                        // eventChange={function(){}}
                        // eventRemove={function(){}}
                    />
                </div>

                <Modal
                    isOpen={this.state.isMultiViewModalOpen}
                    onRequestClose={() => this.closeMultiViewModal()}
                    className="test2"
                    contentLabel="Detail d'un créneau"
                >
                    <PracticeMultiViewModal
                        onClose={() => this.closeMultiViewModal()}
                        onSave={(state) =>
                            this.handleCreateInterval(state)
                        }
                        schedule={this.state.selectedSchedule}
                        bands={this.state.bands}
                        band={this.state.bands[0]}
                    />
                </Modal>

                <Modal
                    isOpen={this.state.isHandleSessionsOpen}
                    onRequestClose={() => this.closeHandleSessionsModal()}
                    className="test2"
                    contentLabel="Modification d'un créneau"
                >
                    <PracticeHandleSessions
                        onClose={() => this.closeHandleSessionsModal()}
                        onSave={(session) => this.handleUpdateSession(session)}
                        onDelete={(session) => this.handleDeleteSession(session)}
                        session={this.state.eventSelected}
                        rooms={this.state.rooms}
                        bands={this.state.bands}
                    />
                </Modal>
            </div>
        );
    }
}

function renderEventContent(eventInfo) {
    return (
        <React.Fragment>
            <b>{eventInfo.timeText}</b>
            <i>{eventInfo.event.title}</i>
        </React.Fragment>
    );
}
