import React from "react";
import PropTypes from "prop-types";
import _ from "lodash";

const moment = require("moment");
require("moment/locale/fr");

import { getSeasonFromDate } from "./TimeIntervalHelpers";

class CreateIntervalModal extends React.Component {
    constructor(props) {
        super(props);

        const detectedSeason = getSeasonFromDate(this.props.newInterval.start.toDate(), this.props.seasons);

        this.state = {
            kind: this.props.kind || "p"
 //           season: detectedSeason && detectedSeason.id || "",
        };

    }

    handleOptionChange(e) {
        this.setState({ kind: e.target.value });

    }

    handleSave() {
        const interval = { ...this.props.newInterval, kind: this.state.kind };
        this.props.onSave(interval, this.state.season);
        this.props.closeModal();
    }

    handleChangeSeason(season) {
        this.setState({ season });
    }


    render() {
        return (
            <div>
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
                        {
                            this
                                .props
                                .seasons
                                .map((s, i) =>
                                    <option key={i} value={s.id}>{s.label}</option>
                                )
                        }
                    </select>
                    <p style={{margin:'10px'}}> <i className="fas fa-info-circle m-r-sm"></i>
                    {(this.state.season=="") ? 
                     'La disponibilité sera ajoutée au créneau sélectionné.' 
                     :
                     'La disponibilité sera ajoutée à la 1ère semaine de la saison.'}
                    </p>
                   

                    <label className="label-control">Type</label>
                    <span className="radio radio-primary">
                        <input
                            type="radio"
                            name="dispo"
                            id="c"
                            value="c"
                            checked={this.state.kind == "c"}
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
                            checked={this.state.kind == "o"}
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
                            checked={this.state.kind == "e"}
                            onChange={e => this.handleOptionChange(e)}
                        />
                        <label htmlFor="e">
                            <span>Evaluation</span>
                        </label>
                    </span>
                </form>
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

export default CreateIntervalModal;
