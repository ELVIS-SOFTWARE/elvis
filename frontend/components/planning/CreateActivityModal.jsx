import React, { Fragment } from "react";
import PropTypes from "prop-types";
import _ from "lodash";

const moment = require("moment");
require("moment/locale/fr");

import { getSeasonFromDate } from "./TimeIntervalHelpers";
import { RECURRENCE_TYPES, WEEKDAYS } from "../../tools/constants";
import { toFullDateFr, toLocaleDate } from "../../tools/format";
import Checkbox from "../common/Checkbox";

class CreateIntervalModal extends React.Component {
    constructor(props) {
        super(props);

        const detectedSeason = getSeasonFromDate(this.props.newInterval.start.toDate(), this.props.seasons);

        // Trouvez la saison actuelle (celle en cours aujourd'hui)
        const currentDate = new Date();
        const currentSeason = getSeasonFromDate(currentDate, this.props.seasons);

        this.state = {
            // Par défaut, c'est une disponibilité ("o")
            kind: this.props.kind || "o",
            season: detectedSeason?.id || (currentSeason?.id || ""),
            isAdminSelectIntervalRecurrence: false,
            isRecurrent: false,
            recurrentType: RECURRENCE_TYPES.getDefault(),
        };
    }
    handleOptionChange(e) {
        this.setState({ kind: e.target.value });
    }

    handleSave() {
        let kind = this.state.kind;
        if (kind === "c" && !this.props.newInterval.activity) {
            kind = "o";
        }

        const interval = {
            ...this.props.newInterval,
            kind,
            recurrentType: this.state.isRecurrent ? this.state.recurrentType : null,
        };

        this.props.handleCloseAndOpenDetails(interval);
    }
    handleChangeSeason(season) {
            this.setState({ season });
        }

    render() {
        let component;

        if (this.props.currentUserIsAdmin && this.props.recurrenceActivated) {
            if (this.state.isAdminSelectIntervalRecurrence) {
                component = <div className="mb-3">
                    <h3>Création d'une {this.state.kind === "p" ? "pause" : "disponibilité"}</h3>
                    <hr />

                    <div className="row">
                        <div className="col-sm-12">
                            Ce créneau sera ajouté pour : <br />
                            <strong>{toFullDateFr(this.props.newInterval.start)}</strong> de &nbsp;
                            <strong>{new Date(this.props.newInterval.start).toLocaleTimeString()}</strong> à &nbsp;
                            <strong>{new Date(this.props.newInterval.end).toLocaleTimeString()}</strong>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-sm-12 py-3">
                            <Checkbox
                                id="isRecurrent"
                                label="Ce créneau est récurrent"
                                input={{
                                    checked: this.state.isRecurrent,
                                    onChange: e => this.setState({ isRecurrent: e.target.checked }),
                                }}
                            />
                        </div>

                        {this.state.isRecurrent && <div className="col-sm-12">
                            <select
                                className="form-control"
                                value={this.state.recurrentType}
                                onChange={e => this.setState({ recurrentType: e.target.value })}
                            >
                                {RECURRENCE_TYPES.getAll()
                                    .filter(type => {
                                        if (this.state.kind === "p") {
                                            return type !== "daily" && type !== "yearly";
                                        }
                                        return true;
                                    })
                                    .map((type, i) => (
                                        <option key={i} value={type}>
                                            {RECURRENCE_TYPES.toString(type)}
                                        </option>
                                    ))}
                            </select>
                        </div>}

                    </div>
                </div>;
            } else {
                const date = new Date(this.props.newInterval.start);

                component = <div className="mb-3">
                    <h3>{toFullDateFr(date)}</h3>
                    <hr />

                    <div className="row btn w-100 p-4 border-hover"
                         onClick={() => this.props.handleCloseAndOpenDetails(this.props.newInterval)}>
                        <div className="col-sm-1">
                            <i className="fas fa-calendar-day"></i>
                        </div>
                        <div className="col-md-11 text-left">
                            Ajout d'un cours
                        </div>
                    </div>

                    <div className="row btn w-100 p-4 border-hover"
                         onClick={() => this.setState({ isAdminSelectIntervalRecurrence: true, kind: "o" })}>
                        <div className="col-sm-1">
                            <i className="far fa-calendar-check"></i>
                        </div>
                        <div className="col-md-11 text-left">
                            Ajout d'une disponibilité
                        </div>
                    </div>

                    <div className="row btn w-100 p-4 border-hover"
                         onClick={() => this.setState({ isAdminSelectIntervalRecurrence: true, kind: "p" })}>
                        <div className="col-sm-1">
                            <i className="fas fa-coffee"></i>
                        </div>
                        <div className="col-md-11 text-left">
                            Ajout d'une pause
                        </div>
                    </div>
                </div>;
            }
        } else {
            component = <Fragment>
                <h3>Création d'un créneau de disponibilité</h3>
                <hr />
                <form className="m-b">
                    <label className="label-control">Créer la disponibilité :</label>
                    <select
                        className="form-control"
                        value={this.state.season}
                        onChange={e => this.handleChangeSeason(e.target.value)}>
                        <option key={-1} value="">
                            sur le créneau sélectionné
                        </option>
                        {this.props.seasons.map((s, i) =>
                            <option key={i} value={s.id}>{s.label}</option>
                        )}
                    </select>
                    <p style={{ margin: "10px" }}>
                        <i className="fas fa-info-circle m-r-sm"></i>
                        {this.state.season === ""
                            ? "La disponibilité sera ajoutée au créneau sélectionné."
                            : "La disponibilité sera ajoutée à la 1ère semaine de la saison."}
                    </p>

                    <label className="label-control">Type</label>

                    <span className="radio radio-primary">
                        <input
                            type="radio"
                            name="dispo"
                            id="c"
                            value="c"
                            checked={this.state.kind === "c"}
                            onChange={e => this.handleOptionChange(e)}
                        />
                        <label htmlFor="c">
                            <span>Cours</span>
                        </label>
                    </span>

                    <span className="radio radio-primary">
                        <input
                            id="o"
                            name="dispo"
                            type="radio"
                            value="o"
                            checked={this.state.kind === "o"}
                            onChange={e => this.handleOptionChange(e)}
                        />
                        <label htmlFor="o">
                            <span>Option</span>
                        </label>
                    </span>

                    <span className="radio radio-primary">
                        <input
                            type="radio"
                            name="dispo"
                            id="e"
                            value="e"
                            checked={this.state.kind === "e"}
                            onChange={e => this.handleOptionChange(e)}
                        />
                        <label htmlFor="e">
                            <span>Evaluation</span>
                        </label>
                    </span>

                    <span className="radio radio-primary">
                        <input
                            type="radio"
                            name="dispo"
                            id="p"
                            value="p"
                            checked={this.state.kind === "p"}
                            onChange={e => this.handleOptionChange(e)}
                        />
                        <label htmlFor="p">
                            <span>Pause</span>
                        </label>
                    </span>
                </form>
            </Fragment>;
        }

        return (
            <div>
                {component}
                <div className="flex flex-space-between-justified">
                    <button type="button" onClick={this.props.closeModal} className="btn">
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

CreateIntervalModal.propTypes = {
    newInterval: PropTypes.object.isRequired,
    seasons: PropTypes.array.isRequired,
    closeModal: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    kind: PropTypes.string,
    handleCloseAndOpenDetails: PropTypes.func,
    currentUserIsAdmin: PropTypes.bool,
    recurrenceActivated: PropTypes.bool,
};

export default CreateIntervalModal;
