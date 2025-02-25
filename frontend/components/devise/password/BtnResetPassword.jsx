import React from 'react';
import PropTypes from 'prop-types';
import swal from 'sweetalert2';
import * as api from '../../../tools/api';

export default function BtnResetPassword({
                                             sendRequest,
                                             text,
                                             className,
                                             textError,
                                             textSuccess,
                                             textNoData,
                                             user
                                         }) {
    function onClick() {
        if (sendRequest.url === "/users/reset_password") {
            if (user && (user.is_admin || user.is_teacher)) {
                api.set()
                    .success(() => swal("Email envoyé !", "", "success"))
                    .error(() => swal("Erreur lors de l'envoi de l'email.", "", "error"))
                    .post(
                        sendRequest.url,
                        { ...sendRequest.data, send_email: "true" },
                        sendRequest.additionnalHeaders
                    );
            } else {
                api.set()
                    .success((data) => {
                        if (!data || !data.reset_link) {
                            swal({
                                title: "Erreur",
                                text: "Erreur lors de la génération du lien",
                                type: "error",
                            });
                            return;
                        }
                        const resetLink = data.reset_link;
                        swal({
                            title: "Lien de réinitialisation",
                            html: `
                                <input id="reset-link" class="swal2-input" value="${resetLink}" readonly>
                                <div id="buttons-container" style="margin-top: 15px;"></div>
                            `,
                            showConfirmButton: false,
                            onOpen: () => {
                                setTimeout(() => {
                                    const container = document.getElementById("buttons-container");
                                    if (!container) return;

                                    const copyButton = document.createElement("button");
                                    copyButton.innerText = "Copier";
                                    copyButton.classList.add("swal2-confirm", "swal2-styled");
                                    copyButton.addEventListener("click", () => {
                                        navigator.clipboard.writeText(resetLink)
                                            .then(() => swal("Lien copié !", "", "success"))
                                            .catch(() => swal("Erreur lors de la copie", "", "error"));
                                    });

                                    const sendButton = document.createElement("button");
                                    sendButton.innerText = "Envoyer par mail";
                                    sendButton.classList.add("swal2-cancel", "swal2-styled");
                                    sendButton.style.marginLeft = "10px";
                                    sendButton.addEventListener("click", () => {
                                        api.set()
                                            .success(() => swal("Email envoyé !", "", "success"))
                                            .error(() => swal("Erreur lors de l'envoi de l'email.", "", "error"))
                                            .post(
                                                sendRequest.url,
                                                { ...sendRequest.data, send_email: "true" },
                                                sendRequest.additionnalHeaders
                                            );
                                    });

                                    container.appendChild(copyButton);
                                    container.appendChild(sendButton);
                                }, 50);
                            }
                        });
                    })
                    .error(() => {
                        swal({
                            title: "Erreur",
                            text: "Impossible de récupérer les informations de l'utilisateur",
                            type: "error",
                        });
                    })
                    .post(sendRequest.url, sendRequest.data, sendRequest.additionnalHeaders);
            }
        } else {
            api.set()
                .success((data) => {
                    if ((!data || data.length === 0) && textNoData) {
                        swal({
                            title: "Erreur",
                            type: "error",
                            text: textNoData,
                        });
                        return;
                    }
                    swal({
                        title: "Succès",
                        type: "success",
                        text: textSuccess,
                    });
                })
                .error(() => {
                    swal({
                        title: "Erreur",
                        type: "error",
                        text: textError || "Une erreur est survenue.",
                    });
                })[sendRequest.type](
                sendRequest.url,
                sendRequest.data,
                sendRequest.additionnalHeaders
            );
        }
    }

    return (
        <button onClick={onClick} className={className}>
            {text}
        </button>
    );
}

BtnResetPassword.propTypes = {
    sendRequest: PropTypes.shape({
        type: PropTypes.string.isRequired,
        url: PropTypes.string.isRequired,
        data: PropTypes.object,
        additionnalHeaders: PropTypes.object,
    }),
    text: PropTypes.string.isRequired,
    className: PropTypes.string.isRequired,
    textError: PropTypes.string,
    textSuccess: PropTypes.string,
    textNoData: PropTypes.string,
    user: PropTypes.shape({
        is_admin: PropTypes.bool,
        is_teacher: PropTypes.bool,
    }),
};
