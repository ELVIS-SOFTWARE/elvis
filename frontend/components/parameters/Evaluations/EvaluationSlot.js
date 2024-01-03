import React, { useState,useEffect } from 'react';
import { useForm } from "react-hook-form";
import swal from "sweetalert2";
import { csrfToken } from "../../utils";
import * as api from "../../../tools/api";

export default function EvaluationSlot(props) {

    const { register, formState: { errors }, handleSubmit } = useForm();
    const [sessionHour,setSessionHour] = useState(null)

    useEffect(() => { 
        getData()
     },[]);


    function getData(){
        api.get(`/admin/get_session_hour`).then(({ data, error }) => {
            if (error) {
                console.info(error)
            } else {
                setSessionHour(data.session_hour.e)
            }
        });
    }

    function onSubmit(data) {

        let formData = new FormData();
        formData.append("sessionHour", data.sessionHour);


        swal({
            title: "chargement...",
            onOpen: () => swal.showLoading()
        });

        fetch("/admin/update_session_hour", {
            method: "post",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
            },
            body: formData
        }).then(res => {
            if (res.ok) {
                res.json().then(json => {
                    swal({
                        type: "success",
                        title: "Enregistrement effectué"
                    });
                });
            } else {
                swal({
                    type: "error",
                    title: "Une erreur est survenue"
                })
            }
        });
    }



    return <div>
        <form className="m-b" onSubmit={handleSubmit(onSubmit)}>
        <div className="col-sm-6">
            <div className="row">
                <div className="col-sm-12">
                    <div className="form-group">
                        <div className="col-sm-8">
                            <label>Durée d'un créneau d'évaluation (en minutes) * :</label>
                            <input className="form-control" type="text" name="sessionHour"  {...register('sessionHour', { required: true })}
                                defaultValue={sessionHour} />
                            <p className="text-danger">{errors.name && "Le créneau est requis"}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col-sm-12">
                    <input type="submit" value="Enregistrer" className="btn text-white black-bg" />
                </div>
            </div>
            </div>
        </form>



    </div>

}

