import React, {Fragment} from "react";
import _ from "lodash";
import ReactTable from "react-table";
import SelectCoupon from "../utils/SelectCoupon";
import DataService from "../common/baseDataTable/DataService";
import CouponFormContent from "../parameters/Payments/CouponFormContent";
import CreateCouponModal from "../common/baseDataTable/ItemFormModal";

const moment = require("moment");
require("moment/locale/fr");


class PaymentsSummary extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            showCreateCouponModal: false,
            coupons: props.coupons,
        };

        this.dataService = new DataService("/coupons");
    }

    showCreateCouponModal() {
        this.setState({
                showCreateCouponModal: true,
            }
        );

    }

    closeCreateCouponModal() {
        this.setState({
            showCreateCouponModal: false,
        });
    }

    insertCoupon(coupons, newCoupon) {
        let index = coupons.findIndex(coupon => coupon.percent_off > newCoupon.percent_off);
        if (index === -1) {
            coupons.push(newCoupon);
        } else {
            coupons.splice(index, 0, newCoupon);
        }
    }

    createCoupon(coupon) {
        return this.dataService.createData(coupon)
            .then((newCoupon) => {
                alert("Le taux de remise a été créé avec succès");
                this.setState((prevState) => {
                        // ajouter le nouveau coupon aux coupons existants
                        this.insertCoupon(prevState.coupons, newCoupon);
                        return [
                            ...prevState
                        ]
                    }
                )
            })
            .catch((err) => {
                console.error(err);
                alert("Une erreur est survenue lors de la création du taux de remise");
            })
            .finally(() => {
                this.closeCreateCouponModal();
            });
    }


    render() {
        const {
            payers,
            totalDue,
            previsionalTotal,
            totalPayments,
            totalPaymentsToDay,
            totalPayback,
        } = this.props;

        const data = [...this.props.data];

        const generalColumns = [
            {
                id: "payer",
                maxWidth: 30,
                sortable: false,
                accessor: d => {
                    if (
                        d.user &&
                        _.includes(_.map(payers, p => p.id), d.user.id)
                    ) {
                        return <i className="fas fa-euro-sign"/>;
                    } else if (d.isOption) {
                        return <i className="fas  fa-hourglass"/>;
                    } else {
                        return null;
                    }
                },
            },
            {
                Header: "Activité",
                id: "activity",
                accessor: d => {
                    return (
                        <div>
                            <div>{d.activity}</div>
                            {d.stopped_at ? (
                                <div className="text-danger">
                                    {`(Arrêt le : ${moment(d.stopped_at).format("DD/MM/YYYY")})`}
                                </div>
                            ) : null}
                        </div>)
                },
            },
            {
                Header: "N° d'adhérent",
                id: "adherent_number",
                width: 50,
                accessor: d =>
                    d.user && d.user.adherent_number != null
                        ? d.user.adherent_number
                        : "",
            },
            {
                Header: "Élève",
                id: "student",
                accessor: d =>
                    d.user ? (
                        <a href={`/users/${d.user.id}`}>
                            {d.user.first_name} {d.user.last_name}
                        </a>
                    ) : null,
            },
            {
                Header: "Tarif",
                id: "tarif",
                maxWidth: 100,
                Cell: props => {
                    // Si il y as un packId
                    if (props.original.packId)
                    {
                        // 15/03/24 on ne permet pas la modification du pack (pour l'instant)
                        return <p>{_.get(props, ["original", "packPrice", "pricing_category", "name"]) || "Inconnue"}</p>;
                    }


                    // Sinon, si la ligne n'a pas d'id, c'est que c'est une adhésion
                    if (props.original.id === 0) {
                        if (this.props.isStudentView) {
                            return <p>{(this.props.adhesionPrices.find(a => props.original.adhesionPriceId) || {}).label}</p>;
                        }

                        // Si il n'y a qu'un seul tarif d'adhésion, l'affecter par défaut
                        let defaultAdhesionPriceId = this.props.adhesionPrices.length === 1 ? this.props.adhesionPrices[0].id : 0;

                        return <Fragment>
                            <select
                                className="form-control"
                                value={props.original.adhesionPriceId || defaultAdhesionPriceId}
                                onChange={e => this.props.handleChangeAdhesionPricingChoice(props.original.adhesionId, e.target.value)}
                            >
                                <option value="0" disabled>
                                    Sélectionner un tarif
                                </option>
                                {(this.props.adhesionPrices || []).map(adhesionPrice => <option key={adhesionPrice.id}
                                                                                                value={adhesionPrice.id}>
                                    {adhesionPrice.label}
                                </option>)}
                            </select>
                        </Fragment>
                    }

                    // Sinon, c'est une activité
                    if (this.props.isStudentView) {
                        const pricingCategory = this.props.pricingCategories.find(
                            p => p.id === props.original.pricingCategoryId
                        );

                        return <p>{pricingCategory ? pricingCategory.label : "aucun tarif défini"}</p>;
                    } else {
                        let activity_ref_pricings = props.original.ref.activity_ref_pricing
                        let season = this.props.seasons.find(s => s.id === this.props.season)
                        let pricings = []

                        activity_ref_pricings.forEach(asp => {
                            if (asp.from_season.start <= season.start && (!asp.to_season || asp.to_season.end >= season.end)) {
                                pricings.push(asp);
                            }
                        });

                        return (
                            <select
                                className="form-control"
                                value={props.original.pricingCategoryId || 0}
                                onChange={evt =>
                                    this.props.handleChangePricingChoice(
                                        props.original.id,
                                        props.original.user.id,
                                        evt
                                    )
                                }
                            >
                                <option value="0" disabled>
                                    Sélectionner un tarif
                                </option>
                                {pricings.map(assoc => {
                                    const pricingCategory = this.props.pricingCategories.find(
                                        p => p.id === assoc.pricing_category_id
                                    );

                                    if (pricingCategory) {
                                        return (
                                            <option key={pricingCategory.id} value={pricingCategory.id}>
                                                {pricingCategory.name}
                                            </option>
                                        );
                                    }
                                })}
                            </select>
                        );
                    }
                },
                accessor: d => (this.props.pricingCategories.find(
                    p => p.id === d.pricingCategoryId
                ) || {}).label
            },
            {
                Header: "Prix unitaire",
                id: "unitPrice",
                maxWidth: 75,
                accessor: d => <p> {d.unitPrice + " €"} </p>,
                style: {
                    textAlign: "right",
                    display: "block",
                },
            },
            {
                Header: "Prorata",
                id: "prorata",
                maxWidth: 75,
                Cell: props => {
                    if (props.original.id === 0) {
                        return null;
                    }

                    const intendedNbLessons = props.original.intended_nb_lessons
                    return <p>{props.original.prorata || intendedNbLessons} sur {intendedNbLessons}</p>;
                },
            },
            {
                Header: "Montant total",
                id: "initial_total",
                maxWidth: 150,
                accessor: d => {
                    let prorataTotal = 0;
                    if (d.id == 0 || d.due_total >= 0) {
                        prorataTotal = d.due_total;
                    } else {
                        prorataTotal = "--";
                    }
                    return (
                        <p>
                            {prorataTotal + " €"}
                        </p>
                    );
                },
                style: {
                    textAlign: "right",
                    display: "block",
                }
            },
            {
                Header: "Remise",
                id: "coupon",
                maxWidth: 100,
                accessor: d => {
                    d.coupon.percent_off ? <p>{d.coupon.percent_off + " %"}</p> : null
                },
                Cell: props => {
                    if (this.props.isStudentView) {
                        return <p>{
                            props.original.coupon.percent_off ?
                                `${props.original.coupon.percent_off}% (${props.original.coupon.label})`
                                : '-'
                        }</p>;
                    }

                    return (
                        <SelectCoupon
                            coupons={this.state.coupons}
                            onChange={value =>
                                this.props.handleChangePercentOffChoice(
                                    props.original.adhesionId || props.original.packId || props.original.id,
                                    props.original.adhesionId ? "Adhesion" : props.original.packId ? "Pack" : "DesiredActivity",
                                    value
                                )
                            }
                            value={props.original.coupon.id}
                        />
                    )
                },
                style: {
                    textAlign: "right",
                    display: "block",
                },
            },
            {
                Header: "Montant total remisé",
                id: "discounted total",
                maxWidth: 150,
                accessor: d => {

                    return <p>{d.discountedTotal.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'EUR'
                    })}</p>;
                },
                style: {
                    textAlign: "right",
                    display: "block",
                    fontSize: "18px",
                    marginBottom: 0,
                },
                Footer: (
                    <span>
                        <span style={{fontSize: "16px"}}>
                            Total:
                            <strong>{` ${totalDue == null
                                ? "--"
                                : totalDue.toLocaleString('fr-FR', {
                                    style: 'currency',
                                    currency: 'EUR'
                                })
                            } `}</strong>
                        </span>
                        <br/>

                        <span style={{fontSize: "16px"}}>
                            Total échéancier:
                            <strong>
                                {` ${previsionalTotal == null
                                    ? "--"
                                    : previsionalTotal.toLocaleString('fr-FR', {
                                        style: 'currency',
                                        currency: 'EUR'
                                    })
                                } `}
                            </strong>
                        </span>
                        <br/>

                        <span style={{fontSize: "16px"}}>
                            Total réglé à ce jour:
                            <strong>
                                {` ${totalPaymentsToDay == 0 &&
                                previsionalTotal == null
                                    ? "--"
                                    : totalPaymentsToDay.toLocaleString('fr-FR', {
                                        style: 'currency',
                                        currency: 'EUR'
                                    })
                                } `}
                            </strong>
                        </span>

                        <br/>

                        <span style={{fontSize: "16px"}}>
                            Solde:
                            <strong>
                                {` ${totalPayments == 0 &&
                                previsionalTotal == null
                                    ? "--"
                                    : (previsionalTotal - totalPayments).toLocaleString('fr-FR', {
                                        style: 'currency',
                                        currency: 'EUR'
                                    })
                                } `}
                            </strong>
                        </span>
                    </span>
                )
            }
        ];


        return (

            <div className="m-b-lg">
                <div className="flex flex-space-between-justified">
                    {/* <a href={`${this.props.payers[0].id}.pdf`}>
                        <button className="btn btn-xs btn-primary pull-right">
                            <i className="fas fa-file-pdf" /> Facture
                    </button>
                    </a>
                    */}
                    {!this.props.isStudentView && _.values(this.props.schedules).length > 0 ? (
                        <div className="form-group">
                            <label>Emplacement global</label>
                            <div>
                                {this.props.locations.map((l, i) => (
                                    <label key={i} className="radio-inline">
                                        <input
                                            type="radio"
                                            name="location"
                                            key={l.id}
                                            value={l.id}
                                            checked={this.props.globalLocation == l.id}
                                            onChange={e => this.props.handleSwitchLocation(null, parseInt(l.id))}
                                        />
                                        {l.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="ibox-title">
                    <h2>Infos générales</h2>
                </div>

                <ReactTable
                    data={data}
                    columns={generalColumns}
                    defaultSorted={[{id: "activity", desc: false}]}
                    resizable={false}
                    previousText="Précedent"
                    nextText="Suivant"
                    loadingText="Chargement..."
                    noDataText="Aucune donnée"
                    pageText="Page"
                    ofText="sur"
                    rowsText="résultats"
                    minRows={1}
                    showPagination={false}
                    className="-striped whitebg"
                />

                <CreateCouponModal
                    component={CouponFormContent}
                    isOpen={this.state.showCreateCouponModal}
                    createTitle={`Créer un taux de remise`}
                    onRequestClose={() => this.closeCreateCouponModal()}
                    onSubmit={item => this.createCoupon(item)}
                />

            </div>
        );
    }


}

export default PaymentsSummary;
