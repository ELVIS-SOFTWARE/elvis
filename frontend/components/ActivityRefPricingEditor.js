import React from "react";

import _ from "lodash";
import CreatableSelect from "react-select/lib/Creatable";

import swal from "sweetalert2";
import { csrfToken } from "./utils";

class ActivityRefPricingEditor extends React.Component {
    constructor(props) {
        super(props);

        //The filter here removes duplicate seasons
        //(by only keeping the last instance of a season's id of the array)
        const selectedSeasons =
            (this.props.activityRefSeasonPricings &&
                this.props.activityRefSeasonPricings
                    .map(a => a.season_id)
                    .filter((id, i, arr) => arr.lastIndexOf(id) === i)
                    .map(id => {
                        return {
                            label: this.props.seasons.find(s => s.id === id)
                                .label,
                            value: id,
                        };
                    })) ||
            [];

        const dataBySeason = _.groupBy(
            this.props.activityRefSeasonPricings,
            e => e.season_id,
        );

        this.state = {
            pricings: this.props.pricings,
            //on the multiValue select
            selectedSeasons,
            //on the pricing select
            selectedSeason: null,
            dataBySeason,
            newPricing: {},
            dataToSave: false,
        };
    }

    handlePricingSelect(values, actionMeta) {
        if (
            actionMeta.action == "select-option" ||
            actionMeta.action == "create-option"
        ) {
            const pricingPromise =
                actionMeta.action === "create-option"
                    ? fetch("/pricings", {
                        method: "POST",
                        headers: {
                            "X-CSRF-Token": csrfToken,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ pricing: _.last(values) }),
                    }).then(res => res.json())
                    : Promise.resolve(
                        this.state.pricings.find(
                            p => p.id == values[values.length - 1].value
                        )
                    );

            return pricingPromise.then(pricing => {
                // Prevent adding the same pricing two times.
                if (!this.state.dataBySeason[this.state.selectedSeason].find(d => d.pricing_id === pricing.id)) {
                    //add entry to dataBySeason
                    const newDataBySeason = { ...this.state.dataBySeason };
                    newDataBySeason[this.state.selectedSeason].push({
                        activity_ref_id: this.props.activityRefId,
                        season_id: this.state.selectedSeason,
                        pricing_id: pricing.id,
                        price: 0.0,
                    });

                    this.setState({
                        pricings: [...this.state.pricings, pricing],
                        dataBySeason: newDataBySeason,
                    });
                }

            });
        } else if (actionMeta.action == "remove-value") {
            //delete pricing entry in data
            const newDataBySeason = { ...this.state.dataBySeason };
            newDataBySeason[this.state.selectedSeason] = newDataBySeason[
                this.state.selectedSeason
            ].filter(e => e.pricing_id != actionMeta.removedValue);

            return this.setState({
                dataBySeason: newDataBySeason,
                dataToSave: true,
            });
        } else if (actionMeta.action == "clear") {
            swal({
                title: "Êtes vous sûr de supprimer tous les tarifs ?",
                type: "warning",
                dangerMode: true,
                confirmButtonText: "Oui !",
                cancelButtonText: "Annuler",
                showCancelButton: true,
            }).then(willDelete => {
                if (willDelete.value) {
                    //only keep the act_ref - season links
                    const newDataBySeason = { ...this.state.dataBySeason };
                    newDataBySeason[
                        this.state.selectedSeason
                    ] = newDataBySeason[this.state.selectedSeason].filter(
                        d => !d.pricing_id
                    );
                    this.setState({
                        dataBySeason: newDataBySeason,
                        dataToSave: true,
                    });
                }
            });
        }
    }

    handleSeasonsSelect(values, actionMeta) {


        //associate a season with the activity_ref
        if (actionMeta.action === "select-option") {
            return fetch("/activity_ref_season_pricings", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    activity_ref_season_pricing: {
                        activity_ref_id: this.props.activityRefId,
                        season_id: _.last(values).value,
                    },
                }),
            })
                .then(res => res.json())
                .then(actSeaPri => {
                    const newSeason = {
                        label: this.props.seasons.find(
                            s => s.id === actSeaPri.season_id
                        ).label,
                        value: actSeaPri.season_id.toString(),
                    };

                    const newDataBySeason = this.state.dataBySeason;

                    newDataBySeason[actSeaPri.season_id] = [];

                    return this.setState({
                        selectedSeasons: [
                            ...this.state.selectedSeasons,
                            newSeason,
                        ],
                        dataBySeason: newDataBySeason,
                        dataToSave: true,
                    });
                });
        }
        //remove association between season and activity_ref (and all pricings with it)
        else if (actionMeta.action == "remove-value") {
            swal({
                title:
                    "Êtes vous sûr de supprimer le lien avec la saison et tous ses tarifs associés ?",
                type: "warning",
                dangerMode: true,
                confirmButtonText: "Oui !",
                cancelButtonText: "Annuler",
                showCancelButton: true,
            }).then(willDelete => {
                if (willDelete.value) {
                    const newSelected = [...this.state.selectedSeasons];
                    _.remove(newSelected, actionMeta.removedValue);

                    const newDataBySeason = this.state.dataBySeason;
                    delete newDataBySeason[actionMeta.removedValue.value];

                    //only reset selectedSeason
                    const newSelectedSeason =
                        this.state.selectedSeason ===
                            actionMeta.removedValue.value
                            ? null
                            : this.state.selectedSeason;

                    return this.setState({
                        selectedSeasons: newSelected,
                        dataBySeason: newDataBySeason,
                        selectedSeason: newSelectedSeason,
                        dataToSave: true,
                    });
                }
            });
        } else if (actionMeta.action == "clear") {
            swal({
                title:
                    "Êtes vous sûr de supprimer tous les liens de saisons et leurs tarifs ?",
                type: "warning",
                dangerMode: true,
                confirmButtonText: "Oui !",
                cancelButtonText: "Annuler",
                showCancelButton: true,
            }).then(willDelete => {
                if (willDelete.value) {
                    this.setState({
                        selectedSeasons: [],
                        dataBySeason: {},
                        selectedSeason: null,
                        dataToSave: true,
                    });
                }
            });
        }
    }

    handleSeasonSelect(e) {
        this.setState({
            selectedSeason: parseInt(e.target.value),
        });
    }

    handlePriceEdit(id, price) {
        const newDataBySeason = this.state.dataBySeason;

        newDataBySeason[this.state.selectedSeason].find(
            d => d.pricing_id == id
        ).price = parseFloat(price);

        this.setState({
            dataBySeason: newDataBySeason,
            dataToSave: true,
        });
    }

    handleChangeNewPricing(e) {
        this.setState({
            newPricing: {
                ...this.state.newPricing,
                [e.target.name]: e.target.value,
            },
            dataToSave: true,
        });
    }

    handleSubmitPricings() {


        const pricings = _.flatten(Object.values(this.state.dataBySeason));

        fetch(`/activity_refs/${this.props.activityRefId}/season_pricings`, {
            method: "POST",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                season_pricings: pricings,
            }),
        }).then(res => {
            if (res.ok) {
                const button = document.getElementById(
                    "handle-submit-pricings-button"
                );
                const classes = button.classList;
                const animation = "validate-animation";

                classes.remove(animation);
                //Je ne comprends rien à cette ligne, mais sans
                //elle l'animation css ne se redémarrerait pas
                void button.offsetWidth;
                classes.add(animation);

                this.setState({ dataToSave: false });
            }
        });
    }

    render() {
        //pricings for the selected season and their prices
        const prices =
            this.state.selectedSeason &&
            _.chain(this.state.dataBySeason[this.state.selectedSeason])
                .filter(a => a.pricing_id)
                .reduce((acc, a) => ({ ...acc, [a.pricing_id]: a.price }), {})
                .value();

        //format the selected pricings to show their label in the select
        let selectedPricings =
            prices &&
            Object.keys(prices).map(id => ({
                label: this.state.pricings.find(p => p.id == id).label,
                value: parseInt(id),
            }));

        //format the pricings to be displayed in the pricing editor table
        const tableRows =
            selectedPricings &&
            selectedPricings.map(o => {
                return { ...o, price: prices[o.value] };
            });

        return (
            <div>
                <div className="form-group">
                    <label>Saisons associées</label>
                    <CreatableSelect
                        isMulti
                        onChange={this.handleSeasonsSelect.bind(this)}
                        value={this.state.selectedSeasons}
                        options={this.props.seasons.map(s => ({
                            label: s.label,
                            value: s.id,
                        }))}
                    />

                    {this.state.selectedSeasons.length > 0 ? (
                        <div>
                            <label>Saison</label>
                            <select
                                className="form-control"
                                onChange={this.handleSeasonSelect.bind(this)}
                                value={this.state.selectedSeason || 0}
                            >
                                <option value={0} />
                                {this.state.selectedSeasons.map(s => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>

                            {this.state.selectedSeason ? (
                                <div>
                                    <label>
                                        Tarifs de l'activité à cette saison
                                    </label>
                                    <CreatableSelect
                                        isMulti
                                        onChange={(values, actionMeta) => {
                                            return this.handlePricingSelect(
                                                values,
                                                actionMeta
                                            );
                                        }}
                                        value={selectedPricings}
                                        options={this.props.pricings.map(p => {
                                            return {
                                                label: p.label,
                                                value: p.id.toString(),
                                            };
                                        })}
                                        placeholder="Sélectionnez un ou des tarifs..."
                                    />

                                    <table className="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>Nom du tarif</th>
                                                <th>Prix du tarif (€)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tableRows &&
                                                tableRows.map(r => (
                                                    <tr key={r.value}>
                                                        <td>{r.label}</td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                onChange={e => {
                                                                    this.handlePriceEdit(
                                                                        r.value,
                                                                        e
                                                                            .currentTarget
                                                                            .value
                                                                    );
                                                                }}
                                                                value={
                                                                    r.price
                                                                }
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>

                <button
                    className={`btn btn-${this.state.dataToSave ? "primary" : "null"
                        }`}
                    disabled={!this.state.dataToSave}
                    onClick={() => this.handleSubmitPricings()}
                    style={{ width: "100%" }}
                    id="handle-submit-pricings-button"
                >
                    <i className="fas fa-save m-r-sm" />
                    Sauvegarder
                </button>
            </div>
        );
    }
}

export default ActivityRefPricingEditor;
