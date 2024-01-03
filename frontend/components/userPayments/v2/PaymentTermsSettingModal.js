import React, {Fragment, useEffect, useState} from "react";
import Modal from "react-modal";
import * as api from "../../../tools/api";
import swal from "sweetalert2";
import {MONTHS} from "../../courses/AddCourseSummary";
import ToggleButtonGroup from "../../ToggleButtonGroup";

export default function PaymentTermsSettingModal({season, user, children, onSaved, isForNew = false})
{
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [paymentTerm, setPaymentTerm] = useState({paymentTermId: null, on_day: null, methodId: null});

    const [allPaymentTerms, setAllPaymentTerms] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);

    function majUserPaymentTerm(payment_methods = null)
    {
        // get user datas
        api.set()
            .success(data =>
            {
                if(data)
                {
                    setPaymentTerm({
                        paymentTermId: data.payment_terms_id,
                        on_day: data.day_for_collection,
                        methodId: (payment_methods ? payment_methods : paymentMethods).findIndex(p => p.id === data.payment_method_id),
                    });
                }
                else
                {
                    setPaymentTerm({paymentTermId: null, on_day: null, methodId: null});
                }
            })
            .error(data =>
            {
                console.error(data);

                swal({
                    title: "Erreur",
                    text: "Une erreur est survenue lors de la récupération des conditions de paiement.",
                    type: "error",
                });
            })
            .get(`/users/${user.id}/paymentTerms`, {season_id: season.id});
    }

    useEffect(() =>
    {
        if(!paymentTerm.paymentTermId)
        {
            const promises = [];

            // get base datas
            promises.push(api.set()
                .success(data =>
                {
                    setAllPaymentTerms(data.data);

                    return data.data;
                })
                .error(data =>
                {
                    console.error(data);

                    swal({
                        title: "Erreur",
                        text: "Une erreur est survenue lors de la récupération des données",
                        type: "error",
                    });
                })
                .get(`/payment-terms`, {season_id: season.id}));

            // get payments methods
            promises.push(api.set()
                .success(data =>
                {
                    setPaymentMethods(data.data);

                    return data.data;
                })
                .error(data =>
                {
                    console.error(data);

                    swal({
                        title: "Erreur",
                        text: "Une erreur est survenue lors de la récupération des méthodes de paiement",
                        type: "error",
                    });
                })
                .get(`/payment_method`, {season_id: season.id}));

            Promise.all(promises).then((d) => majUserPaymentTerm(d[1]));
        }
    }, []);

    useEffect(() =>
    {
        majUserPaymentTerm();
    }, [season]);

    function onSave()
    {
        api.set()
            .success(data =>
            {
                setModalIsOpen(false);

                swal({
                    title: "Succès",
                    text: "Les modalités de paiement ont bien été enregistrées.",
                    type: "success",
                });

                if(onSaved && typeof onSaved === "function")
                    onSaved({
                        term_name: allPaymentTerms.find(p => p.id === paymentTerm.paymentTermId).label,
                        payment_method: paymentMethods[paymentTerm.methodId].label,
                    });
            })
            .error(data =>
            {
                console.error(data);

                swal({
                    title: "Erreur",
                    text: "Une erreur est survenue lors de l'enregistrement des modalités de paiement.",
                    type: "error",
                });
            })
            .post(`/users/${user.id}/paymentTerms`, {
                season_id: season.id,
                payment_terms_id: paymentTerm.paymentTermId,
                day_for_collection: paymentTerm.on_day,
                payment_method_id: paymentMethods[paymentTerm.methodId].id,
            });
    }

    const payTermObject = allPaymentTerms.find(p => p.id === paymentTerm.paymentTermId);

    return <Fragment>
        <button className="btn btn-primary px-sm-5" onClick={() => setModalIsOpen(true)}>
            {children}
        </button>

        <Modal
            isOpen={modalIsOpen}
            onRequestClose={() => setModalIsOpen(false)}
            contentLabel="Modal"
            className="modal-dialog modal-lg"
            ariaHideApp={false}
        >
            <div className="row">
                <div className="m-t-md alert alert-warning px-sm-3 py-sm-4">
                    Attention, une fois la modalité sélectionnée, vous ne pourrez plus la modifier pour cette saision<br/>
                    Il sera possible de modfier le jour et la méthode de paiement.
                </div>
            </div>

            <div className="row">
                <div className="col-sm-6">
                    <p>Sélectionnez la modalité de paiement </p>
                    <select className="form-control"
                            disabled={!isForNew}
                            value={paymentTerm.paymentTermId || ""}
                            onChange={(e) => setPaymentTerm({...paymentTerm, paymentTermId: parseInt(e.target.value)})}>
                        <option value={""}></option>
                        {allPaymentTerms.map(pt => <option key={pt.id} value={pt.id}>{pt.label}</option>)}
                    </select>
                </div>
                <div className="col-sm-12">
                    {paymentTerm.paymentTermId && <div className="m-t-md alert alert-info px-sm-3 py-sm-4">
                        Le prélèvement sera fait au mois suivant: {payTermObject.collect_on_months.map(m => MONTHS[m]).join(", ")}
                    </div>}
                </div>
            </div>

            <div className="m-t-md row">
                <div className="col-sm-12">
                    <p>Sélectionnez le jour de prélèvement</p>

                    <div className="row">
                        {payTermObject && <ToggleButtonGroup
                            selected={[paymentTerm.on_day]}
                            childrenContent={payTermObject.days_allowed_for_collection.map(d => <span>{d}</span>)}
                            onChange={(selected) => setPaymentTerm({...paymentTerm, on_day: selected[0]})}
                        />}
                    </div>
                </div>
            </div>

            <div className="row m-t-md">
                <div className="col-sm-12">
                    <p>Sélectionnez le moyen de paiement</p>
                </div>

                <ToggleButtonGroup
                    selected={[paymentTerm.methodId]}
                    onChange={(selected) => setPaymentTerm({...paymentTerm, methodId: selected[0]})}
                    childrenContent={paymentMethods.map(m => <div>
                        {getIconForPaymentMethod(m)}
                        <p>{m.label}</p>
                    </div>)}
                    buttonStyles={{
                        width: "100%",
                        height: "75px",
                    }}
                    buttonClasses={"col-sm-3"}
                />
            </div>

            <div className="row m-t-md">
                <div className="col-sm-12 text-right">
                    <button className="btn btn-primary px-sm-5" onClick={onSave}>
                        Enregistrer
                    </button>
                </div>
            </div>
        </Modal>
    </Fragment>
}

export const getIconForPaymentMethod = (method) =>
{
    // based on built-in payment methods ids
    // default for others => customization later ?
    switch (method.id)
    {
        case 1: return <i className="fa fa-money-bill" />;
        case 2: return <i className="fa fa-money-check" />;
        case 6: case 12: return <i className="fas fa-university" />;
        case 8: return <i className="fa fa-credit-card" />;
        default: return <i className="fa fa-euro-sign" />;
    }
}