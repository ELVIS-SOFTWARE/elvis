import React from "react";
import {useState} from "react";
import swal from "sweetalert2";
import Modal from "react-modal";

export default function CancelApplication(props) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    function handleModal() {
        setIsModalOpen(!isModalOpen);
    }

    return (
        <div>
            <button className="btn mr-4"
                    style={{
                        color: "#00334A",
                        borderRadius: "8px",
                        fontWeight: "bold"
                    }}
                    onClick={() => handleModal()}
            >Annuler
            </button>

            <Modal
                isOpen={isModalOpen}
                onRequestClose={() => handleModal()}
                className="modal-xl"
                ariaHideApp={false}
                contentLabel="Modifier votre inscription"
                style={{
                    content: {
                        width: "700px" // Agrandir la modal à 700px
                    }
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
                                }}>
                            Voir mes demandes
                        </button>
                    </div>
                </div>


            </Modal>

        </div>

    )
}
