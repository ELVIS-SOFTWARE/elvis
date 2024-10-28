import React, {Fragment, useEffect, useState} from "react";
import * as api from "../../../tools/api";
import swal from "sweetalert2";
import {toast} from "react-toastify";
import { EditorState, convertToRaw, convertFromRaw, ContentState } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';

export default function EditPaymentScheduleOptions()
{
    const [paymentScheduleOptions, setPaymentScheduleOptions] = useState([]);
    const [indexValues, setIndexValues] = useState([]);
    const [paymentScheduleOptionsActivated, setPaymentScheduleOptionsActivated] = useState(false);
    const [init, setInit] = useState(true);
    const [editorState, setEditorState] = useState(
        () => EditorState.createEmpty(),
    );

    useEffect(() =>
    {
       api.set()
           .success(res =>
           {
                setPaymentScheduleOptions(res.data);
                setPaymentScheduleOptionsActivated(res.activated);
                setInit(false);
                setIndexValues(res.index)

                // Convertir le contenu JSON brut en ContentState
               let savedContentRaw = null;
               let savedContentState = null;
               if (res.display_text != null) {
                   try {
                       savedContentRaw = JSON.parse(res.display_text);
                       savedContentState = convertFromRaw(savedContentRaw);
                   } catch (e) {
                       savedContentState = ContentState.createFromText(res.display_text);
                   }
                   setEditorState(EditorState.createWithContent(savedContentState));
               }
           })
           .error(res =>
           {
               swal("Une erreur est survenue lors de la récupération des options d'échéancier de paiement", res.error, "error");
           })
           .get("/payment_schedule_options", {});
    }, []);

    useEffect(() =>
    {
        if(!init)
        {
            api.set()
                .error(res =>
                {
                    swal("Une erreur est survenue lors de la mise à jour des conditions de paiement", res.error, "error");
                })
                .post("/payment_schedule_options/activated", {activated: paymentScheduleOptionsActivated});
        }

    }, [paymentScheduleOptionsActivated]);

    const onItemDelete = (paymentScheduleOption) =>
    {
        swal({
            title: "Êtes-vous sûr ?",
            text: "La suppression de cette option d'échéancier de paiement est définitive.",
            type: "warning",
            showCancelButton: true,
            confirmButtonText: "Oui, supprimer",
            cancelButtonText: "Non, annuler",
        }).then((result) =>
        {
            if (result.value)
            {
                api.set()
                    .success(res =>
                    {
                        setPaymentScheduleOptions(paymentScheduleOptions.filter(p => p.id !== paymentScheduleOption.id));
                    })
                    .error(res =>
                    {
                        swal("Une erreur est survenue lors de la suppression de l'option d'échéancier de paiement", res.error, "error");
                    })
                    .del(`/payment_schedule_options/${paymentScheduleOption.id}`, {});
            }
        });
    };

    const onSaveDisplayText = () =>
    {
        api.set()
            .success(res => {
                toast.success("Les informations complémentaires ont été enregistrées.");
            }).error(res => {
                swal("Une erreur est survenue lors de la mise à jour des informations complémentaires", res.error, "error");
            })
            .post("/payment_schedule_options/display_text", {display_text: JSON.stringify(convertToRaw(editorState.getCurrentContent()))});
    };

    function handleMoveUp(paymentId) {
        api.set()
            .success(payment => {
                setPaymentScheduleOptions(payment);
            })
            .error(() => {
                swal({
                    title: "Erreur lors de la récupération des données",
                    type: "error",
                });
            })
            .post(`/payment_schedule_options/move_up`,
                {id: paymentId}
            );
    }

    function handleMoveDown(paymentId) {
        api.set()
            .success(payment => {
                setPaymentScheduleOptions(payment);
            })
            .error(() => {
                swal({
                    title: "Erreur lors de la récupération des données",
                    type: "error",
                });
            })
            .post(`/payment_schedule_options/move_down`,
                {id: paymentId}
            );
    }

    /**
     * @author Xavier Maquignon
     * @param d1
     * @param d2
     * @returns {number}
     */
    function compareIndices(d1, d2) {
        if (d1.index && d2.index)
            return d1.index - d2.index;
        else
            return 0;
    }

    return <Fragment>
        <div className="row">
            <div className="col-sm-12">
                <h4>Visibilité</h4>

                <div className="checkbox checkbox-primary">
                    <input
                        type="checkbox"
                        id={"paymentScheduleOptionsActivated"}
                        className=""
                        checked={paymentScheduleOptionsActivated}
                        onChange={e => setPaymentScheduleOptionsActivated(e.target.checked)}
                    />
                    <label htmlFor={"paymentScheduleOptionsActivated"}>Afficher les modalités de paiement dans le parcours d'inscription</label>
                </div>
            </div>
        </div>

        <div className="row mt-5">
            <div className="col-sm-12">
                <h4>Renseigner et ajouter vos modalités de paiement</h4>
            </div>

            <div className="col-sm-12 text-right">
                <a className={"btn btn-primary"} href={`/payment_schedule_options/new?returnUrl=${encodeURIComponent(window.location)}`}>
                    <i className="fas fa-plus"></i> Ajouter une option d'échéancier de paiement
                </a>
            </div>
        </div>

        <div className="row">
            <div className="col-sm-12">
                {paymentScheduleOptions
                    .sort(compareIndices)
                    .map((paymentScheduleOption, index) =>
                {
                    return <EditPaymentScheduleOptionItem
                                key={paymentScheduleOption.id}
                                paymentScheduleOption={paymentScheduleOption}
                                index={index} onDelete={onItemDelete}
                                onMoveUp={handleMoveUp}
                                onMoveDown={handleMoveDown}
                                isFirst={paymentScheduleOption.index === Math.min(...indexValues)}
                                isLast={paymentScheduleOption.index === Math.max(...indexValues)}
                    />
                })}
            </div>
        </div>

        <div className={"row mt-5"}>
            <div className="col-sm-12">
                <h4>Renseigner des informations complémentaires sur les modalités de paiement.</h4>
            </div>

            <form onSubmit={e => {e.preventDefault(); onSaveDisplayText()}}>
                <div className={"col-sm-12"}>
                    <Editor
                        wrapperStyle={{border: "1px solid #e7eaec", padding: "5px", borderRadius:"5px"}}
                        editorState={editorState}
                        onEditorStateChange={setEditorState}
                        toolbarClassName="toolbarClassName"
                        wrapperClassName="wrapperClassName"
                        editorClassName="editorClassName"
                        toolbar={{
                            options: ['inline', 'blockType', 'emoji', 'list', 'link'],
                            inline: {
                                options: ['bold', 'italic', 'underline', 'strikethrough'],
                            },
                            blockType: {
                                inDropdown: true,
                                options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'Blockquote'],
                            },
                            link: {
                                inDropdown: false,
                                showOpenOptionOnHover: true,
                                defaultTargetOption: '_self',
                                options: ['link', 'unlink'],
                            },
                        }}
                    />
                </div>

                <div className={"col-sm-12"}>
                    <button type="submit" className={"btn btn-primary mt-3 animated fadeInLeft pull-right"}>
                        Enregistrer les informations complémentaires.
                    </button>
                </div>
            </form>
        </div>
    </Fragment>
}

const EditPaymentScheduleOptionItem = ({paymentScheduleOption, index, isFirst, isLast, onDelete, onMoveUp, onMoveDown}) =>
{
    return <div className="row mx-0 my-3 border-hover" style={{
        backgroundColor: "rgb(226,237,243)",
        color: "black",
        borderColor: "black",
        borderWidth: "2px",
        borderStyle: "solid",
        borderRadius: "5px",
    }}>

        <div className="col-sm-1">
            <div className="btn btn-md"
                 onClick={() => isFirst ? "" : onMoveUp(paymentScheduleOption.id)}>
                {isFirst || <i className="fas fa-chevron-up"></i>}&nbsp;
            </div>
            <div
                className="btn btn-md"
                onClick={() => isLast ? "" : onMoveDown(paymentScheduleOption.id)}>
                {isLast || <i className="fas fa-chevron-down"></i>}&nbsp;
            </div>
        </div>

        <a className="col-sm-10 btn btn-lg text-dark text-decoration-none" href={`/payment_schedule_options/${paymentScheduleOption.id}/edit?returnUrl=${encodeURIComponent(window.location)}`}>
            {paymentScheduleOption.label}
        </a>

        <div className="col-sm-1 text-right btn btn-lg" onClick={() => onDelete(paymentScheduleOption)}>
            <i className="fas fa-times" />
        </div>
    </div>
};
