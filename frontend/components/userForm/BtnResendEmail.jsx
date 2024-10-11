import React from 'react';
import * as api from "../../tools/api";
import swal from "sweetalert2";

const BtnResendEmail = ({ user_id }) =>
{
    const resendEmail = () =>
    {
        api.set()
            .success((data) => {

                if(!data || data.length === 0)
                {
                    swal({
                        title: "error",
                        type: "error",
                        text: "Compte déjà configuré"
                    });
                    return;
                }

                swal({
                    title: "Email envoyé",
                    type: "success",
                    text: "Un email de confirmation a été envoyé à l'utilisateur."
                });
            })
            .error((res) => {
                swal({
                    title: "error",
                    type: "error",
                    text: "Une erreur est survenue lors de l'envoi de l'email."
                });
            })
            .post(`/users/resend_confirmation`, {ids: [user_id]});
    };

    return <button onClick={resendEmail} className="btn btn-warning btn-block">
        Renvoyer l'email de confirmation
    </button>
}

export default BtnResendEmail;