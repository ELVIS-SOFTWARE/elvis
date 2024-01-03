import React from "react";

import _, { isNumber } from "lodash";
import swal from "sweetalert2";
import * as api from "../../tools/api";

class ActivityRefPricings extends React.Component {
    constructor(props) {
        super(props);

        const selectedSeasons = this.props.seasons.map(s => ({ label: s.label, value: s.id }));

        const dataBySeason = _.groupBy(
            this.props.activityRefSeasonPricings,
            e => e.season_id,
        );

        this.state = {
            pricings: this.props.pricings,
            //on the multiValue select
            selectedSeasons,
            //on the pricing select
            selectedSeason: this.props.currentSeasonId,
            dataBySeason,
            newPricing: {},
            dataToSave: false,
        };

        this.addTypeTarif = this.addTypeTarif.bind(this);
    }

    componentDidMount() {
        if (this.props.onChange) {
            this.props.onChange(this.state);
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.onChange) {
            this.props.onChange(this.state);
        }
    }


    handleSeasonSelect(e) {
        this.setState({
            selectedSeason: parseInt(e.target.value),
        });
    }

    handlePriceEdit(id, label, price) {
        const newDataBySeason = this.state.dataBySeason;

        let data   = undefined

        if (newDataBySeason[this.state.selectedSeason]) {
            data = newDataBySeason[this.state.selectedSeason].find(d => d.pricing_id == id)
        } else {
            newDataBySeason[this.state.selectedSeason] = []
        }

        // si data n'est pas null, c'est déjà une ligne existante en bdd,
        if (data != undefined)
        {
            if(isNaN(price)) {
                // si le prix est vide, on supprime la ligne
                newDataBySeason[this.state.selectedSeason] = newDataBySeason[this.state.selectedSeason].filter(d => d.pricing_id != id)
            } else
            // on la met à jour directement
            data.price = Math.abs(parseFloat(price))
        }
        // sinon c'est une nouvelle ligne à créer ; on va utiliser le nom du tarif pour retrouver le pricing_id correspondant
        else if(!isNaN(price))
        {
            const pricing = this.state.pricings.find(p => (p.label == label))
            if (pricing == undefined) {
                // ce n'est pas normal d'arriver là
                console.log("unable to find pricing with label=", label)
            } else {
                newDataBySeason[this.state.selectedSeason].push({
                    activity_ref_id: this.props.activityRefId,
                    price: Math.abs(parseFloat(price)),
                    pricing_id: pricing.id,
                    season_id: this.state.selectedSeason
                })
            }
        }

        this.setState({
            dataBySeason: newDataBySeason,
            dataToSave: true,
        });
    }

    addTypeTarif()
    {
        swal({
            type: 'question',
            title: 'Quel sera le nom du nouveau tarif ?',
            input: 'text',
            showCancelButton: true,
            confirmButtonText: 'Ajouter',
            cancelButtonText: 'Annuler',
            showLoaderOnConfirm: true,
            preConfirm: (name) => {
                return new Promise((resolve, reject) => {
                    if (name === '') {
                        reject('Le nom du tarif ne peut pas être vide');
                    } else {
                        api.set()
                            .success((data) => {
                                resolve(data);
                            })
                            .error((data) => {
                                reject(data);
                            })
                            .post('/pricings', {
                                pricing: {
                                    label: name,
                                }
                            });
                    }
                });
            }
        }).then((result) => {
            if (result.value) {
                this.setState({
                    pricings: [...this.state.pricings, result.value]
                });
            }
        });
    }

    render() {
        //pricings for the selected season and their prices
        let prices =
            _.chain(this.state.dataBySeason[this.state.selectedSeason])
                .filter(a => a.pricing_id)
                .reduce((acc, a) => ({ ...acc, [a.pricing_id]: a.price }), {})
                .value();
        if (prices == null) {
            prices = []
        }

        //format the selected pricings to show their label in the select

        let selectedPricings =
            this.state.pricings.map(p => ({
                label: p.label,
                value: p.id,
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

                    <div className="row">
                        <div className="col-sm-12 text-right">
                            <button className="btn btn-primary" onClick={this.addTypeTarif} type="button">
                                Ajouter un type de tarif
                            </button>
                        </div>
                    </div>


                    {this.state.selectedSeasons.length > 0 ? (
                        <div>
                            <div className="row-sm-3 form-group">
                                <label>Saison</label>
                                <select
                                    className="form-control"
                                    onChange={this.handleSeasonSelect.bind(this)}
                                    value={this.state.selectedSeason}
                                >
                                    {this.state.selectedSeasons.map(s => (
                                        <option key={s.value} value={s.value}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {this.state.selectedSeason ? (
                                <div className="row-sm-3 form-group">
                                    <label>
                                        Tarifs de l'activité à cette saison
                                    </label>


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
                                                            <div className="col-sm-12">
                                                                <input
                                                                    type="number"
                                                                    className="form-control"
                                                                    onChange={e => {
                                                                        this.handlePriceEdit(
                                                                            r.value,
                                                                            r.label,
                                                                            e.currentTarget.value ? Number(e.currentTarget.value) : NaN
                                                                        );
                                                                    }}
                                                                    value={
                                                                        r && isNumber(r.price) ? `${r.price}` : ""
                                                                    }
                                                                />
                                                            </div>
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


            </div>
        );
    }
}

export default ActivityRefPricings;
