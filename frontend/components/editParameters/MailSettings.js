import React, {useState} from 'react';
import {useForm} from "react-hook-form";
import {csrfToken} from "../utils";
import swal from "sweetalert2";

export default function MailSettings(props) {
    const {register, formState: {errors}, handleSubmit} = useForm();

    function onSubmit(data) {
        fetch('/parameters/mails', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                mail_settings: {
                    from: data.from,
                    address: data.address,
                    authentication: data.authentication,
                    domain: data.domain,
                    password: data.password,
                    port: data.port,
                    redirect: data.redirect.split('\n'),
                    ssl_tls: data.sslTls,
                    user_name: data.user_name,
                }
            })
        }).then(response => {
            if (response.ok) {
                swal({
                    title: 'Success',
                    text: 'Les paramètres ont bien été pris en compte',
                    icon: 'success'
                });
            } else {
                swal({
                    title: 'Error',
                    text: 'Une erreur est survenue, contactez un administrateur',
                    icon: 'error'
                });
            }
        });
    }

    return <form onSubmit={handleSubmit(onSubmit)}>
        <div className="col-md-6 col-xs-12">
            <div>
                <label>Adresse SMTP:</label>
                <input className="form-control" type="text" {...register("address", {required: true})}
                       defaultValue={props.mail_settings.address}/>
                <p className="text-danger">{errors.address && "L'adresse smtp est requise"}</p>
            </div>

            <div>
                <label>Port SMTP:</label>
                <input className="form-control" type="number" {...register("port", {required: true})}
                       defaultValue={props.mail_settings.port}/>
                <p className="text-danger">{errors.port && "Le port est requis"}</p>
            </div>

            <div>
                <label>Domaine</label>
                <input className="form-control" type="text" {...register("domain", {required: false})}
                       defaultValue={props.mail_settings.domain}/>
            </div>


            <div className="mt-2 mb-2">
                <label>Activer SSL/TLS: </label><br/>
                <input className="m-2" type="checkbox" {...register("sslTls", {})}
                       defaultChecked={props.mail_settings.sslTls}/>

            </div>

            <div>
                <label>Authentification:</label>
                <select className="form-control" type="select" {...register("authentication", {required: true})}
                        defaultValue={props.mail_settings.authentication}>
                    <option value="login">login</option>
                    <option value="plain">plain</option>
                </select>
                <p className="text-danger">{errors.authentication && "Le type d'authentification est requis"}</p>
            </div>

            <div>
                <label>Identifiant:</label>
                <input className="form-control" type="text" {...register("user_name", {required: true})}
                       defaultValue={props.mail_settings.user_name}/>
                <p className="text-danger">{errors.user_name && "L'identifiant est requis"}</p>
            </div>

            <div>
                <label>Mot de passe (il ne sera changé que si le champ est rempli):</label>
                <input className="form-control"
                       type="password" {...register("password", {required: props.mail_settings.password == ""})} />
                <p className="text-danger">{errors.password && "Le mot de passe est requis"}</p>
            </div>

            <div>
                <label>Rediriger tous les mails vers les adresses suivantes (séparer par des retours à la
                    ligne):</label>
                <textarea className="form-control" {...register("redirect")}>
                    {(props.mail_settings.redirect || []).join('\n')}
                </textarea>
                <p>Ne rien mettre pour ne pas rediriger</p>
            </div>

            <div>
                <label>Adresse d'envoi par défaut</label>
                <input type="email" className="form-control" {...register("from", {required: true})}
                       defaultValue={props.mail_settings.from}/>
            </div>

            <div className="text-right mt-5">
                <input type="submit" value="Enregistrer" className="btn btn-primary"/>
            </div>
        </div>

    </form>
}