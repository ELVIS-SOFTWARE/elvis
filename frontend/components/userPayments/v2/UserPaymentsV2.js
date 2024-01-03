import React, {Fragment, useEffect, useState} from "react";
import _ from "lodash";
import * as api from "../../../tools/api";
import swal from "sweetalert2";
import PaymentTermsSettingModal from "./PaymentTermsSettingModal";

const LOCAL_STORAGE_KEY_SEASON = "user_payments_v2_season";

export default function UserPaymentsV2({seasons, user, is_current_user, onPayClicked, onSeasonChanged})
{
    const savedSeasonId = parseInt(localStorage.getItem(LOCAL_STORAGE_KEY_SEASON));

    const [season, setSeason] = useState(seasons.find(s => s.id == savedSeasonId) || _.sortBy(seasons, "start").pop());

    const [data, setData] = useState([]);
    const [duePaymentsData, setDuePaymentsData] = useState([]);
    const [paymentTerms, setPaymentTerms] = useState({});

    function getDatas()
    {
        api.set()
            .success((data) =>
            {
                setData(data.general_infos);
                setDuePaymentsData(data.due_payments);
                setPaymentTerms(data.payment_payer_terms);
            })
            .error(data =>
            {
                console.error(data);

                swal({
                    title: "Erreur",
                    text: "Une erreur est survenue lors de la récupération des informations de paiement.",
                    type: "error",
                });
            })
            .get(`/users/${user.id}/payments/data`, {season_id: season.id});
    }

    useEffect(() =>
    {
        localStorage.setItem(LOCAL_STORAGE_KEY_SEASON, season.id);

        getDatas();

        if(onSeasonChanged && typeof onSeasonChanged === "function")
            onSeasonChanged(season);
    }, [season]);

    return <Fragment>
        <div className="row wrapper border-bottom white-bg page-heading m-b-md">
            <h2>
                {is_current_user ? "Mes règlements" : "Règlements de " + user.full_name}
            </h2>
        </div>

        <div className="row m-b-md">
            <div className="col-sm-3 col-xl-2">
                <select className="form-control"
                        value={season.id}
                        onChange={(e) => setSeason(seasons.find(s => s.id === parseInt(e.target.value)))}>
                    {seasons.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
            </div>
        </div>

        <div className="row m-b-md">
            <div className="col-sm-12 col-md-9 col-xl-6">
                <div className="ibox">
                    <div className="ibox-title">
                        <h3>Vos informations générales</h3>
                    </div>

                    <div className="ibox-content p-4">
                        <div className="row">
                            <div className="col-sm-10">
                                <table className="table table-borderless m-b-md table-hover">
                                    <thead>
                                    <tr>
                                        <th>Activités</th>
                                        <th>Élève</th>
                                        <th>Prorata</th>
                                        <th>Montant</th>
                                    </tr>
                                    </thead>

                                    <tbody>
                                    {data.map(d => <tr key={d.id}>
                                        <td>{d.activity}</td>
                                        <td>{d.user_full_name}</td>
                                        <td>{d.prorata ? `${d.prorata} / ${d.intended_nb_lessons}` : ""}</td>
                                        <td>{d.amount} €</td>
                                    </tr>)}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-sm-12">
                                <h3>Montant total: {_.sumBy(data, d => d.amount)} €</h3>
                            </div>
                        </div>

                        {onPayClicked && typeof onPayClicked === "function" && <div className="row">
                            <div className="col-sm-12 text-right">
                                <button className="btn btn-primary px-sm-5" onClick={() => onPayClicked(season)}>
                                    Payer
                                </button>
                            </div>
                        </div>}
                    </div>
                </div>
            </div>

            <div className="col-sm-6 col-md-3 col-xl-4">
                <div className="ibox">
                    <div className="ibox-title">
                        <h3>Vos modalités de paiement</h3>
                    </div>

                    <div className="ibox-content p-4">
                        <div className="row m-b-md">
                            <div className="col-sm-12">
                                <h4>Paiement</h4>

                                {(paymentTerms || {}).term_name || "Non saisi"}
                            </div>
                        </div>

                        {(paymentTerms || {}).payment_method && <div className="row">
                            <div className="col-sm-12">
                                <h4>Moyen de paiement</h4>
                            </div>

                            <div className="col-sm-6">
                                <div style={{border: "1px solid lightgrey"}} className="p-sm-2 img-rounded">
                                    <div className="row">
                                        <div className="col-sm-12 text-center">
                                            <i className="fa fa-credit-card fa-2x"></i>
                                        </div>
                                    </div>

                                    <div className="row m-t-sm">
                                        <div className="col-sm-12 text-center">
                                            <strong>{paymentTerms.payment_method}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>}

                        <div className="row m-t-md">
                            <div className="col-sm-12 text-right">
                                <PaymentTermsSettingModal
                                    user={user}
                                    season={season}
                                    isForNew={!(paymentTerms || {}).payment_method}
                                    onSaved={() => getDatas()}>
                                    {(paymentTerms || {}).payment_method ? "Modifier" : "Ajouter"}
                                </PaymentTermsSettingModal>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {duePaymentsData.length > 0 && <div className="row">
            <div className="col-sm-12 col-md-9 col-xl-6">
                <div className="ibox">
                    <div className="ibox-title">
                        <h3>Vos échéances</h3>
                    </div>

                    <div className="ibox-content p-4">
                        <div className="alert alert-info p-2 px-sm-3 py-sm-4">
                            Votre jour de prélèvement préféré est le {paymentTerms.day_for_collection}. <br/>
                            Par conséquent, les échéances ci-dessous ont été générées (sous réserve de modification par un administrateur).
                        </div>

                        <table className="table table-borderless table-hover">
                            <thead>
                            <tr>
                                <th>Date de l'échéance</th>
                                <th>Montant</th>
                                <th>Statut</th>
                            </tr>
                            </thead>

                            <tbody>
                            {duePaymentsData.map(d => <tr key={d.id}>
                                <td>{new Date(d.due_date).toLocaleDateString()}</td>
                                <td>{d.amount} €</td>
                                <td>
                                        <span style={{width: "87px"}} className={`d-block text-center text-white p-2 px-sm-4 ${d.status === 0 ? "bg-green" : d.status === 1 ? "bg-warning" : "bg-danger"}`}>
                                            {d.status === 0 ? "Validé" : d.status === 1 ? "A venir" : "En retard"}
                                        </span>
                                </td>
                            </tr>)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>}
    </Fragment>
}