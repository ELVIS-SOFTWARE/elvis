import React, { Fragment } from "react";
import { fullname } from "../../../tools/format";

const moment = require("moment-timezone");
require("moment/locale/fr");

export default class PracticeHandleSessions extends React.Component {
    constructor(props){
        super(props);

        let start = new Date(props.session.start);
        let end = new Date(props.session.end);

        this.state= {
            session: {id: props.session.id},
            roomId: props.session.resourceId,
            bandId: props.session.bandId,
            dateStart: start.toISOString().substring(0,10),
            hourStart: start.toLocaleString().substring(12),
            hourEnd: end.toLocaleString().substring(12),
            validated: true,
        }
    }

    handleSave() {
        this.props.onClose();
        this.props.onSave(this.state.session)
    }

    roomChange(event) {
        let roomId= event.target.value;
        this.setState({
            session: {
                ...this.state.session,
                room: roomId,
            },
            roomId,
        })
    }

    dateChange(event) {
        let date = new Date(event.target.value);
        let start = this.state.session.start 
            ? new Date(this.state.session.start) 
            : new Date(this.props.session.start);
        start.setFullYear(date.getFullYear());
        start.setMonth(date.getMonth());
        start.setDate(date.getDate());
        
        let end = this.state.session.end 
            ? new Date(this.state.session.end) 
            : new Date(this.props.session.end);
        end.setFullYear(date.getFullYear());
        end.setMonth(date.getMonth());
        end.setDate(date.getDate());

        this.setState({
            session: {
                ...this.state.session,
                start: start.toISOString(),
                end: end.toISOString(),
            },
            dateStart: event.target.value,
            validated: this.validateDate(event.target.value),
        })
    }

    validateDate(dateStart) {
        let day = new Date(dateStart).getUTCDay();
        let validated = !(day === 0 || day === 6) 
        return validated
    }


    hourStartChange(event) {
        let hour = event.target.value
        let start = this.state.session.start 
            ? new Date(this.state.session.start)
            : new Date(this.props.session.start); 
        start.setHours(hour.substring(0,2))
        start.setMinutes(hour.substring(3))

        this.setState({
            session: {
                ...this.state.session,
                start: start.toISOString(),
            },
            hourStart: hour,
        })
    }

    hourEndChange(event) {
        let hour = event.target.value
        let end = this.state.session.end 
            ? new Date(this.state.session.end)
            : new Date(this.props.session.end); 
        end.setHours(hour.substring(0,2))
        end.setMinutes(hour.substring(3))

        this.setState({
            session: {
                ...this.state.session,
                end: end.toISOString(),
            },
            hourEnd: hour,
        })
    }

    validateHour(hourStart) {
        // not implemented
        // check room business hours
    }

    bandChange(event) {
        let bandId= event.target.value;
        this.setState({
            session: {
                ...this.state.session,
                band: bandId,
            },
            bandId,
        })
    }

    statusChange(event) {
        // this.setState({session: {
        //     ...this.state.session,
        //     status: select,
        // }})
    }

    onDelete() {
        this.props.onDelete(this.state.session);
        this.props.onClose();
    }

    render() {
        const {session, rooms, bands} = this.props;
        // let {start, stop} = {start: this.state.dateStart, stop: this.state.dateEnd};
        // start = new Date(start).toISOString().substring(0, 10);
        // console.log(start)
        return <div>
            <h3>Édition de réservation</h3>
            <hr/>
            <div >
                <label> Salle </label>
                <select id="room" 
                    onChange={e => this.roomChange(e)}
                    value={this.state.roomId}>
                    {rooms.map(r => 
                        <option
                            key={r.id}
                            value={r.id}
                            >
                            {r.title}
                        </option>)}
                </select>
            </div>
            <div >
                <label> Groupe </label>
                <select id="band" 
                    onChange={e => this.bandChange(e)}
                    value={this.state.bandId}>
                    {bands.map(b => 
                        <option
                            key={b.id}
                            value={b.id}
                            >
                            {b.name}
                        </option>)}
                </select>
            </div>
            <div >
                <label> Créneau </label>
                <div className="flex flex-space-between-justified">
                    <label>Date:</label><input type="date" id="start" value={this.state.dateStart} onChange={e => this.dateChange(e)}/>
                    <label>début:</label><input type="time" id="hourStart" value={this.state.hourStart} onChange={e => this.hourStartChange(e)}/>
                    <label>fin:</label><input type="time" id="hourEnd" value={this.state.hourEnd} onChange={e => this.hourEndChange(e)}/>
                </div>
            </div>
            <div className="flex flex-space-between-justified">
                <button type="button" onClick={this.props.onClose} className="btn" >
                    <i className="fas fa-times m-r-sm"></i>
                    Annuler
                </button>
                <button
                    className="btn btn-warning"
                    onClick={() => this.onDelete()}
                    title={"non implémenté"}
                >
                    Supprimer
                </button>
                <button
                    className="btn btn-primary"
                    onClick={() => this.handleSave()}
                    disabled={!this.state.validated}
                    title={this.state.validated ? "" : "la date n'est pas valide"}
                >
                    Enregistrer
                </button>
            </div>
        </div>
    }
}