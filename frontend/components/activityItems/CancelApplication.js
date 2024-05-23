import React from "react";
import {useState} from "react";
import swal from "sweetalert2";
import Modal from "react-modal";
import * as api from "../../tools/api";

export default function CancelApplication({activityApplicationId}) {
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    function handleModal(witchModal) {
        if (witchModal === "success") {
            setIsSuccessModalOpen(!isSuccessModalOpen);
        } else if (witchModal === "confirm") {
            setIsConfirmModalOpen(!isConfirmModalOpen);
        }
    }

    function handleProcessCancelApplication() {
        api.set()
            .useLoading()
            .success(() =>
            {
                handleModal("confirm");
                handleModal("success");

            })
            .error(() => {
                swal({
                    title: "Erreur lors de l'annulation de l'inscription",
                    type: "error",
                }).then(() => handleModal("confirm"));
            })
            .del(`/destroy/activity_application/${activityApplicationId}`, {});
    }

    return (
        <div>
            <button className="btn btn-sm mr-2"
                    style={{
                        color: "#00334A",
                        borderRadius: "8px",
                        fontWeight: "bold"
                    }}
                    onClick={() => {
                        handleModal("confirm");
                    }}>
                Annuler
            </button>

            <Modal
                isOpen={isConfirmModalOpen}
                onRequestClose={() => handleModal("confirm")}
                className="modal-xl"
                ariaHideApp={false}
                contentLabel="Confirmation de l'annulation de l'inscription"
                style={{
                    content: {
                        width: "700px" // Agrandir la modal à 700px
                    }
                }}
            >
                <div className="m-5">
                    <h2 className="modal-header mb-3" style={{color: "#00334A", textAlign: "left"}}>
                        Cela annulera votre demande d'inscription. Êtes-vous sûr ?
                    </h2>

                    <div className="d-flex justify-content-end mt-5 btn-secondary">
                        <button className="btn mr-2"
                                style={{
                                    borderRadius: "8px",
                                    fontWeight: "bold",
                                }}

                                onClick={() => {
                                    handleModal("confirm");
                                }}
                        >
                            Non
                        </button>

                        <button className="btn text-white"
                                style={{
                                    backgroundColor: "#00334A",
                                    borderRadius: "8px",
                                    fontWeight: "bold",
                                }}

                                onClick={() => {
                                    handleProcessCancelApplication();
                                }}
                        >
                            Oui
                        </button>
                    </div>
                </div>


            </Modal>


            {/** Modal de success */}
            <Modal
                isOpen={isSuccessModalOpen}
                onRequestClose={() => {
                    handleModal("success");
                    window.location.reload();
                }}
                className="modal-xl"
                ariaHideApp={false}
                contentLabel="Inscription annulée"
                style={{
                    content: {
                        width: "700px", // Agrandir la modal à 700px
                    },
                }}
            >
                <div className="m-5">
                    <h2 className="modal-header mb-3" style={{color: "#00334A", textAlign: "left"}}>
                        Votre demande d'inscription est annulée
                    </h2>
                    <p className="h4 mb-5">Vous pouvez procéder à une nouvelle demande d'inscription</p>
                    <div className="d-flex justify-content-end mt-5">
                        <button className="btn text-white"
                                style={{
                                    backgroundColor: "#00334A",
                                    borderRadius: "8px",
                                    fontWeight: "bold"
                                }}

                                onClick={() => {
                                    handleModal("success")
                                    window.location.reload()
                                }}
                        >
                            Voir mes demandes
                        </button>
                    </div>
                </div>


            </Modal>

        </div>

    )
}
