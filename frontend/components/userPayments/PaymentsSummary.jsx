import React, { Fragment } from "react";
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
        });
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
        return this.dataService
            .createData(coupon)
            .then((newCoupon) => {
                alert("Le taux de remise a été créé avec succès");
                this.setState((prevState) => {
                    this.insertCoupon(prevState.coupons, newCoupon);
                    return { coupons: prevState.coupons };
                });
            })
            .catch((err) => {
                console.error(err);
                alert("Une erreur est survenue lors de la création du taux de remise");
            })
            .finally(() => {
                this.closeCreateCouponModal();
            });
    }

    isActivityInFormula(activity) {
        return activity.des &&
            activity.des.activity_application &&
            activity.des.activity_application.formule_id;
    }

    getFormulaIdFromActivity(activity) {
        return activity.des &&
            activity.des.activity_application &&
            activity.des.activity_application.formule_id;
    }

    processDataWithFormulas(data) {
        const processedData = _.cloneDeep(data);

        const activitiesByFormula = {};
        const formulaIds = new Set();

        processedData.forEach(item => {
            const formulaId = this.getFormulaIdFromActivity(item);
            if (formulaId) {
                formulaIds.add(formulaId);
                if (!activitiesByFormula[formulaId]) {
                    activitiesByFormula[formulaId] = [];
                }
                activitiesByFormula[formulaId].push(item);
            }
        });

        if (formulaIds.size === 0) {
            return processedData;
        }

        const result = [];

        formulaIds.forEach(formulaId => {
            const formulaActivities = activitiesByFormula[formulaId];
            if (formulaActivities.length > 0) {
                const firstActivity = formulaActivities[0];
                const formulaDetails = this.props.formulas
                    ? _.find(this.props.formulas, f => f.id == formulaId) || { id: formulaId, name: `Formule inconnue`, description: "" }
                    : { id: formulaId, name: `Formule #${formulaId}`, description: "" };

                const formulaPrice = (formulaDetails.formule_pricings && formulaDetails.formule_pricings.length > 0)
                    ? formulaDetails.formule_pricings[0].price
                    : 0;


                const coupon = firstActivity.coupon || {};

                let discountedTotal = formulaPrice;
                if (coupon.percent_off) {
                    discountedTotal = _.round(formulaPrice * (1 - coupon.percent_off / 100), 2);
                }

                const formulaHeaderRow = {
                    id: `formula-${formulaId}`,
                    isFormula: true,
                    activity: formulaDetails.name,
                    user: firstActivity.user,
                    unitPrice: formulaPrice,
                    discountedTotal: discountedTotal,
                    due_total: discountedTotal,
                    coupon: coupon,
                    formula: { ...formulaDetails, price: formulaPrice }
                };

                result.push(formulaHeaderRow);

                formulaActivities.forEach(activity => {
                    activity.isFormulaItem = true;
                    activity.formulaId = formulaId;
                    result.push(activity);
                });
            }
        });

        processedData.forEach(item => {
            if (!this.isActivityInFormula(item)) {
                result.push(item);
            }
        });

        return result;
    }

    render() {

        const {
            payers,
            totalDue,
            previsionalTotal,
            totalPayments,
            totalPaymentsToDay,
        } = this.props;

        const data = this.processDataWithFormulas([...this.props.data]);

        const generalColumns = [
            {
                id: "payer",
                maxWidth: 30,
                sortable: false,
                accessor: d => {
                    if (d.user && _.includes(_.map(payers, p => p.id), d.user.id)) {
                        return <i className="fas fa-euro-sign" />;
                    } else if (d.isOption) {
                        return <i className="fas fa-hourglass" />;
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
                            <div>
                                {d.isFormula && (
                                    <i title="Formule" />
                                )}
                                {d.isFormulaItem && (
                                    <span className="ml-3" style={{ color: "#777" }}>
                            ↳{" "}
                        </span>
                                )}
                                {d.activity}
                            </div>
                            {d.isFormula && d.subActivities && (
                                <div className="ml-4 text-sm" style={{ color: "#555" }}>
                                    {d.subActivities.map((activity, index) => (
                                        <div key={index}>• {activity}</div>
                                    ))}
                                </div>
                            )}
                            {d.stopped_at ? (
                                <div className="text-danger">
                                    {`(Arrêt le : ${moment(d.stopped_at).format("DD/MM/YYYY")})`}
                                </div>
                            ) : null}
                        </div>
                    );
                },
            },
            {
                Header: "Formule",
                id: "formula",
                accessor: d => {
                    return (
                        <div>
                            {d.isFormula && <i title="Formule" />}
                            {d.formula ? (
                                <div>
                                    {d.formula.name}
                                    {d.formula.description && <p>{d.formula.description}</p>}
                                </div>
                            ) : (
                                <span>Aucune formule</span>
                            )}
                        </div>
                    );
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
                    if (props.original.isFormula) {
                        return <p>Tarif formule</p>;
                    }

                    if (props.original.isFormulaItem) {
                        return <p>Inclus dans la formule</p>;
                    }

                    if (props.original.packId) {
                        return (
                            <p>
                                {_.get(props, ["original", "packPrice", "pricing_category", "name"]) ||
                                    "Inconnue"}
                            </p>
                        );
                    }
                    if (props.original.id === 0) {
                        if (this.props.isStudentView) {
                            return (
                                <p>
                                    {(this.props.adhesionPrices.find(a => props.original.adhesionPriceId) ||
                                        {}).label}
                                </p>
                            );
                        }
                        return (
                            <Fragment>
                                <select
                                    className="form-control"
                                    value={props.original.adhesionPriceId || 0}
                                    onChange={e =>
                                        this.props.handleChangeAdhesionPricingChoice(
                                            props.original.adhesionId,
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="0" disabled>
                                        Sélectionner un tarif
                                    </option>
                                    {(this.props.adhesionPrices || []).map(adhesionPrice => (
                                        <option key={adhesionPrice.id} value={adhesionPrice.id}>
                                            {adhesionPrice.label}
                                        </option>
                                    ))}
                                </select>
                            </Fragment>
                        );
                    }
                    if (this.props.isStudentView) {
                        const pricingCategory = this.props.pricingCategories.find(
                            p => p.id === props.original.pricingCategoryId
                        );
                        return <p>{pricingCategory ? pricingCategory.label : "aucun tarif défini"}</p>;
                    } else {
                        let activity_ref_pricings = props.original.ref.activity_ref_pricing;
                        let season = this.props.seasons.find(s => s.id === this.props.season);
                        let pricings = [];
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
                accessor: d =>
                    (this.props.pricingCategories.find(p => p.id === d.pricingCategoryId) || {}).label,
            },
            {
                Header: "Prix unitaire",
                id: "unitPrice",
                maxWidth: 75,
                accessor: d => <p>{d.unitPrice + " €"}</p>,
                style: {
                    textAlign: "right",
                    display: "block",
                },
            },
            {
                Header: "Prorata",
                id: "prorata",
                maxWidth: 100,
                Cell: props => {
                    if (props.original.id === 0 || props.original.isFormula) return null;
                    const intendedNbLessons = props.original.intended_nb_lessons;
                    const currentProrata = props.original.prorata || intendedNbLessons;

                    if (this.props.isStudentView) {
                        return <p>{currentProrata} sur {intendedNbLessons}</p>;
                    }

                    return (
                        <div style={{ display: "flex", alignItems: "center", fontSize: "14px" }}>
                            <input
                                type="number"
                                className="form-control"
                                style={{
                                    width: "45px",
                                    height: "28px",
                                    padding: "2px 4px",
                                    fontSize: "12px",
                                    marginRight: "3px",
                                    textAlign: "center",
                                    border: "1px solid #ccc"
                                }}
                                value={currentProrata}
                                min="0"
                                max={intendedNbLessons}
                                onChange={e => {
                                    const newProrata = parseInt(e.target.value) || 0;
                                    if (newProrata <= intendedNbLessons && this.props.handleChangeProrataForDesiredActivity) {
                                        this.props.handleChangeProrataForDesiredActivity(props.original.id, newProrata);
                                    }
                                }}
                            />
                            <span>/ {intendedNbLessons}</span>
                        </div>
                    );
                },
            },
            {
                Header: "Montant total",
                id: "initial_total",
                maxWidth: 150,
                accessor: d => {
                    let prorataTotal = 0;
                    if (d.id === 0 || d.due_total >= 0) {
                        prorataTotal = d.due_total;
                    } else {
                        prorataTotal = "--";
                    }
                    return <p>{prorataTotal + " €"}</p>;
                },
                style: {
                    textAlign: "right",
                    display: "block",
                },
            },
            {
                Header: "Remise",
                id: "coupon",
                maxWidth: 100,
                accessor: d => {
                    return d.coupon?.percent_off ? `${d.coupon.percent_off} %` : '-';
                },

                Cell: props => {
                    if (props.original.isFormulaItem) {
                        return <p>-</p>;
                    }

                    if (this.props.isStudentView) {
                        return (
                            <p>
                                {props.original.coupon.percent_off
                                    ? `${props.original.coupon.percent_off}% (${props.original.coupon.label})`
                                    : '-'}
                            </p>
                        );
                    }
                    return (
                        <SelectCoupon
                            coupons={this.state.coupons}
                            onChange={value => {

                                if (props.original.isFormula) {
                                    this.props.handleChangePercentOffChoice(
                                        props.original.formula.id,
                                        "Formula",
                                        value
                                    );
                                } else {
                                    this.props.handleChangePercentOffChoice(
                                        props.original.adhesionId || props.original.packId || props.original.id,
                                        props.original.adhesionId ? "Adhesion" : props.original.packId ? "Pack" : "DesiredActivity",
                                        value
                                    );
                                }
                            }}
                            value={props.original.coupon.id}
                        />
                    );
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
                    return (
                        <p>
                            {d.discountedTotal.toLocaleString("fr-FR", {
                                style: "currency",
                                currency: "EUR",
                            })}
                        </p>
                    );
                },
                style: {
                    textAlign: "right",
                    display: "block",
                    fontSize: "18px",
                    marginBottom: 0,
                },
                Footer: (
                    <span>
                        <span style={{ fontSize: "16px" }}>
                          Total:
                          <strong>
                            {` ${
                                totalDue == null
                                    ? "--"
                                    : totalDue.toLocaleString("fr-FR", {
                                        style: "currency",
                                        currency: "EUR",
                                    })
                            } `}
                          </strong>
                        </span>
                        <br />
                        <span style={{ fontSize: "16px" }}>
                          Total échéancier:
                          <strong>
                            {` ${
                                previsionalTotal == null
                                    ? "--"
                                    : previsionalTotal.toLocaleString("fr-FR", {
                                        style: "currency",
                                        currency: "EUR",
                                    })
                            } `}
                          </strong>
                        </span>
                        <br />
                        <span style={{ fontSize: "16px" }}>
                          Total réglé à ce jour:
                          <strong>
                            {` ${
                                totalPaymentsToDay == 0 && previsionalTotal == null
                                    ? "--"
                                    : totalPaymentsToDay.toLocaleString("fr-FR", {
                                        style: "currency",
                                        currency: "EUR",
                                    })
                            } `}
                          </strong>
                        </span>
                        <br />
                        <span style={{ fontSize: "16px" }}>
                          Solde:
                          <strong>
                            {` ${
                                totalPayments == 0 && previsionalTotal == null
                                    ? "--"
                                    : (previsionalTotal - totalPayments).toLocaleString("fr-FR", {
                                        style: "currency",
                                        currency: "EUR",
                                    })
                            } `}
                          </strong>
                        </span>
                    </span>
                ),
            },
        ];

        return (
            <div className="m-b-lg">
                <div className="flex flex-space-between-justified">
                    {!this.props.isStudentView &&
                    _.values(this.props.schedules).length > 0 ? (
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
                                            checked={
                                                this.props.globalLocation ==
                                                l.id
                                            }
                                            onChange={e =>
                                                this.props.handleSwitchLocation(
                                                    null,
                                                    parseInt(l.id)
                                                )
                                            }
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
                    <div className="ibox-tools">

                                <button
                                    className="btn btn-primary btn-xs mr-2"
                                    type="button"
                                    id="addCoupon"
                                    onClick={() => this.showCreateCouponModal()}>
                                    <i className="fas fa-plus m-r-xs" />
                                    Créer un taux de remise
                                </button>
                    </div>
                </div>

                <ReactTable
                    data={data}
                    columns={generalColumns}
                    defaultSorted={[{ id: "activity", desc: false }]}
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