import React, { Fragment } from "react";
import { fullname } from "../../../tools/format";

const moment = require("moment-timezone");
require("moment/locale/fr");

// MAIN COMPONENT
class PracticeMultiViewModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            band: this.props.band.id,
            start: this.props.schedule.start,
            end: this.props.schedule.end,
            startTime: moment(this.props.schedule.startStr).format('HH:mm'),
            endTime:  moment(this.props.schedule.endStr).format('HH:mm'),
            room: this.props.schedule.resource.id
        };
    }

    handleChangeBand(selectedBand) {
        this.setState({ band: selectedBand });
    }

    handleStartChange(start){
        var startSplit = start.split(':');
        var hour = startSplit[0];
        var minute = startSplit[1];
        
        this.setState({
            startTime : start
        })

        this.state.start.setHours(hour);
        this.state.start.setMinutes(minute);
    }

    handleEndChange(end){
        var endSplit = end.split(':');
        var hour = endSplit[0];
        var minute = endSplit[1];
        this.setState({
            endTime : end
        })

        this.state.end.setHours(hour);
        this.state.end.setMinutes(minute);
    }

    handleSave(){
        this.props.onSave(this.state);
        this.props.onClose();
    }

    render() {
        const { schedule } = this.props;
        // Do not render if schedule is falsy
        if (!schedule) {
            return null;
        }

        // Render
        return (
            <div>
                <h3>Création d'une réservation</h3>
                <hr />
                <form className="m-b">
                    <label className="label-control">Groupe</label>
                    <select
                        className="form-control"
                        value={this.state.band}
                        onChange={e => this.handleChangeBand(parseInt(e.target.value))}>
                        {
                            this
                                .props
                                .bands
                                .map((s, i) =>
                                    <option key={i} value={s.id}>{s.name}</option>
                                )
                        }
                    </select>

                    <label className="label-control">Début</label>
                    <input 
                        className="form-control"
                        type="time"
                        name="start"
                        value={this.state.startTime}
                        onChange={e => this.handleStartChange(e.target.value)}
                    />

                    <label className="label-control">Fin</label>
                    <input 
                        className="form-control"
                        type="time"
                        name="end"
                        value={this.state.endTime}
                        onChange={e => this.handleEndChange(e.target.value)}
                    />
                </form>
                <div className="flex flex-space-between-justified">
                    <button type="button" onClick={this.props.onClose} className="btn">
                        <i className="fas fa-times m-r-sm"></i>
                        Annuler
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => this.handleSave()}
                    >
                        Enregistrer
                    </button>
                </div>
            </div>
        );
    }
}

export default PracticeMultiViewModal;
