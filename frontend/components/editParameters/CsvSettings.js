import React, {useState} from 'react';
import {useForm} from "react-hook-form";
import {csrfToken} from "../utils";
import swal from "sweetalert2";

export default function CsvSettings(props) {
    const {register, formState: {errors}, handleSubmit} = useForm();

    function onSubmit(data) {
        fetch('/parameters/csv_export', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                csv_settings: {
                    col_sep: data.colSep,
                    encoding: data.encoding
                }
            })
        }).then(response => {
            if (response.ok) {
                swal({
                    title: 'Succès',
                    text: 'Les paramètres ont bien été pris en compte',
                    icon: 'success'
                });
            } else {
                swal({
                    title: 'Erreur',
                    text: 'Une erreur est survenue. Contactez un administrateur',
                    icon: 'error'
                });
            }
        });
    }

    return <form onSubmit={handleSubmit(onSubmit)}>
        <div className="col-md-6 col-xs-12">
            <div>
                <label>Séparateur de colonnes</label>
                <input className="form-control" type="text" {...register("colSep", {required: true})}
                       defaultValue={props.csv_settings.col_sep}/>
                <p className="text-danger">{errors.col_sep && "Le séparateur de colonnes est requis"}</p>
            </div>

            <div>
                <label>Encodage de caractères</label>
                <select className="form-control" type="select" {...register("encoding", {required: true})}
                        defaultValue={props.csv_settings.encoding}>
                    <option value="UTF-8">UTF-8</option>
                    <option value="ISO-8859-15">ISO-8859-15</option>
                    <option value="windows-1252">Windows-1252</option>
                </select>
                <p className="text-danger">{errors.encoding && "L'encodage de caractères est requis"}</p>
            </div>

            <div className="text-right mt-5">
                <input type="submit" value="Enregistrer" className="btn btn-primary text-white"/>
            </div>
        </div>

    </form>
}