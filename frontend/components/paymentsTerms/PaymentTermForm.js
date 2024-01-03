import React, {Fragment, useState} from "react";
import ToggleButtonGroup from "../ToggleButtonGroup";
import {MONTHS} from "../courses/AddCourseSummary";
import swal from "sweetalert2";
import {toast} from "react-toastify";
import * as api from "../../tools/api";
import {PAYMENT_TERMS_TERM_NUMBERS} from "../advancedSearch/utils";

export default function PaymentTermForm({paymentTerm, action, return_url, method, pricings})
{
    if(paymentTerm)
    {
        if(!PAYMENT_TERMS_TERM_NUMBERS.map(t => t.nb).includes(paymentTerm.terms_number))
        {
            paymentTerm.other_terms_number = paymentTerm.terms_number;
            paymentTerm.terms_number = 0;
        }
    }

    const [statedPaymentTerm, setStatedPaymentTerm] = useState(paymentTerm || {});

    const onMonthSelected = selected =>
    {
       if(selected.length <= (statedPaymentTerm.terms_number === 0 ? statedPaymentTerm.other_terms_number || 12 : statedPaymentTerm.terms_number))
       {
           const newStatedPaymentTerm = {...statedPaymentTerm};

           newStatedPaymentTerm.collect_on_months = selected;
           setStatedPaymentTerm(newStatedPaymentTerm);

           return true;
       }

       return false;
    };

    const onDayForCollectionAdd = () =>
    {
        swal({
            title: "Ajouter un jour de prélèvement",
            text: "Veuillez saisir le jour de prélèvement",
            input: "number",
            showCancelButton: true,
            confirmButtonText: "Ajouter",
            cancelButtonText: "Annuler",
            inputValidator: (value) =>
            {
                if (!value)
                {
                    return "Veuillez saisir un jour de prélèvement";
                }
                else if (value < 1 || value > 31)
                {
                    return "Veuillez saisir un jour de prélèvement valide";
                }
            }
        }).then((result) =>
        {
            if (result.value)
            {
                const newStatedPaymentTerm = {...statedPaymentTerm};

                newStatedPaymentTerm.days_allowed_for_collection = newStatedPaymentTerm.days_allowed_for_collection || [];
                newStatedPaymentTerm.days_allowed_for_collection.push(parseInt(result.value));
                setStatedPaymentTerm(newStatedPaymentTerm);
            }
        });
    };

    /**
     * @param {FormDataEvent<HTMLFormElement>} e
     */
    const submit = (e) =>
    {
        if((statedPaymentTerm.days_allowed_for_collection || []).length === 0)
        {
            toast.error("Veuillez ajouter au moins un jour de prélèvement", {
                autoClose: 3000,
            });
            return;
        }

        if((statedPaymentTerm.collect_on_months || []).length !== (statedPaymentTerm.terms_number || parseInt(statedPaymentTerm.other_terms_number)))
        {
            toast.error("Veuillez sélectionner un mois de prélèvement pour chaque échéance", {
                autoClose: 3000,
            });
            return;
        }

        const valueToSend = {
            payment_term: {
                ...statedPaymentTerm,
                terms_number: statedPaymentTerm.terms_number === 0 ? statedPaymentTerm.other_terms_number : statedPaymentTerm.terms_number,
                other_terms_number: undefined
            }
        }

        const apiAction = api.set()
            .success(res =>
            {
                window.location = return_url;
            })
            .error(res =>
            {
               swal({
                     title: "Erreur",
                        text: res.error,
                        type: "error",
                        confirmButtonText: "Fermer",
               });
            });

        method = method == "delete" ? "del" : method || "post";

        apiAction[method](action, valueToSend);
    };

    return <Fragment>
        <div className="row wrapper border-bottom white-bg page-heading m-b-md">
            <h2>
                {statedPaymentTerm.id ? `Modifier la modalité de paiement "${paymentTerm.label}"` : "Ajouter une modalité de paiement"}
            </h2>
        </div>

        <form
            onSubmit={e => {
                e.preventDefault();
                submit(e);
            }}
        >
            <div className="row mb-3">
                <div className={"col-md-12"}>
                    <h4>Nom de la modalité de paiment <span className={"text-danger"}>*</span> </h4>
                    <input
                        type={"text"}
                        className={"form-control"}
                        value={statedPaymentTerm.label}
                        required
                        onChange={e => setStatedPaymentTerm({...statedPaymentTerm, label: e.target.value})}
                    />
                </div>
            </div>

            <div className="row mb-3">
                <div className={"col-md-12"}>
                    <h4>Nombre d'échéances <span className={"text-danger"}>*</span> </h4>

                    <select
                        className="custom-select form-control"
                        required
                        value={statedPaymentTerm.terms_number}
                        onChange={e => setStatedPaymentTerm({...statedPaymentTerm, terms_number: parseInt(e.target.value)})}
                    >
                        <option value={null}></option>
                        {PAYMENT_TERMS_TERM_NUMBERS.map(t => <option value={t.nb} >{t.label}</option>)}
                        <option value={0}>Autres</option>
                    </select>
                </div>
            </div>

            {statedPaymentTerm.terms_number === 0 && <div className="row mb-3">
                <div className={"col-md-12"}>
                    <h4>Autres <span className={"text-danger"}>*</span> </h4>
                    <input
                        type={"number"}
                        min={1}
                        max={12}
                        className={"form-control"}
                        value={statedPaymentTerm.other_terms_number}
                        onChange={e => setStatedPaymentTerm({...statedPaymentTerm, other_terms_number: e.target.value})}
                    />
                </div>
            </div>}

            <div className="row mb-5">
                <div className={"col-md-12"}>
                    <h4>Tarif associé </h4>
                    <small>Sélectionner le type de tarif que vous voulez associer à cette modalité de paiement. Les types de tarifs sont à définir dans le menu Paiement > paramétrage</small>

                    <select
                        className="custom-select form-control"
                        value={statedPaymentTerm.pricing_id}
                        onChange={e => setStatedPaymentTerm({...statedPaymentTerm, pricing_id: parseInt(e.target.value)})}
                        >
                        <option value={null}>Aucun</option>
                        {pricings.map(pricing => <option key={pricing.id} value={pricing.id}>{pricing.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="row">
                <div className={"col-md-12"}>
                    <h4>Sélectionner le ou les mois de prélèvement</h4>

                    <ToggleButtonGroup
                        maxSelected={statedPaymentTerm.terms_number === 0 ? statedPaymentTerm.other_terms_number || 12 : statedPaymentTerm.terms_number}
                        onChange={onMonthSelected}
                        selected={statedPaymentTerm.collect_on_months || []}
                        childrenContent={MONTHS.map((month, i) => MontInGroup(month))}
                        buttonStyles={{
                            width: "100px",
                            height: "75px",
                            backgroundColor: "white"
                        }}
                    />
                </div>
            </div>

            <div className={"row mt-5"}>
                <div className={"col-md-12"}>
                    <h4>Jour du prélèvement</h4>
                </div>

                <div className={"col-md-12 mt-3"}>
                    Ajouter un ou plusieurs jours possibles de prélèvement. L'élève pourra choisir le jour souhaité.
                </div>

                <div className={"col-md-12 mt-3 text-right"}>
                    <button className={"btn btn-primary"} onClick={onDayForCollectionAdd} type={"button"}>
                        <i className={"fa fa-plus"} /> Ajouter un jour de prélèvement
                    </button>
                </div>
            </div>

            <div className="row mt-2">
                {statedPaymentTerm && statedPaymentTerm.days_allowed_for_collection && statedPaymentTerm.days_allowed_for_collection.sort((a, b) => a - b).map((day, i) => <div key={i} className={"col-sm-12"}>
                    <DayForCollectionItem day={day} onDelete={day => setStatedPaymentTerm({...statedPaymentTerm, days_allowed_for_collection: statedPaymentTerm.days_allowed_for_collection.filter(d => d !== day)})} />
                </div>)}
            </div>

            <div className="row mt-4">
                <div className={"col-md-12 text-right"}>
                    <button type="submit" className={"btn btn-primary"}>
                        Enregistrer
                    </button>
                </div>
            </div>
        </form>
    </Fragment>
}

function MontInGroup(month)
{
    return <div className="d-block">
        <i className="w-100 fas fa-calendar-alt" />
        <span className="d-block w-100 text-center">{month}</span>
    </div>
}

function DayForCollectionItem({day, onDelete})
{
    return <div className="row bg-white mx-0 my-3">
        <div className="col-sm-11 btn-lg">
            <strong>{day}</strong>
        </div>

        <div className="col-sm-1 text-right btn btn-lg" onClick={() => onDelete(day)}>
            <i className="fas fa-times" />
        </div>
    </div>
}