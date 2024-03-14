import React from "react";
import {useState} from "react";
import swal from "sweetalert2";
import Modal from "react-modal";

export default function EditApplication(props) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

    function handleEditModal() {
        setIsEditModalOpen(!isEditModalOpen);
    }

    function handleConfirmationModal() {
        setIsConfirmationModalOpen(!isConfirmationModalOpen);
    }

    return (
        <div>
            <button className="btn text-white mr-4"
                    style={{
                        backgroundColor: "#00334A",
                        borderRadius: "8px",
                        fontWeight: "bold"
                    }}
                    onClick={() => handleEditModal()}
            >Modifier
            </button>

            <Modal
                isOpen={isEditModalOpen}
                onRequestClose={() => handleEditModal()}
                className="modal-sm"
                ariaHideApp={false}
                contentLabel="Modifier votre inscription"
                style={{
                    content: {
                        width: "700px"
                    }
                }}
            >
                <div className="m-5">
                    <h2 className="modal-header mb-3" style={{color: "#00334A", textAlign: "left"}}>
                        Modifier votre demande d'inscription
                    </h2>
                    <div className="content" style={{height: "200px"}}>
                        <textarea id="editInput" name="editInput" style={{width: "100%", height: "100%"}} wrap="soft"
                                  defaultValue="Indiquer les modifications à nous communiquer (disponibilité, choix professeur)"></textarea>
                    </div>
                    <div className="d-flex justify-content-end mt-5">
                        <button className="btn text-white"
                                style={{
                                    backgroundColor: "#00334A",
                                    borderRadius: "8px",
                                    fontWeight: "bold"
                                }}
                                onClick={() => {
                                    handleEditModal();
                                    handleConfirmationModal();
                                }}

                        >
                            Modifier
                        </button>
                    </div>
                </div>

            </Modal>

            <Modal
                isOpen={isConfirmationModalOpen}
                onRequestClose={() => handleConfirmationModal()}
                className="modal-sm"
                ariaHideApp={false}
                contentLabel="Modification réussie"
                style={{
                    content: {
                        width: "700px"
                    }
                }}
            >
                <div className="m-5">
                    <h2 className="modal-header mb-3" style={{color: "#00334A", textAlign: "left"}}>
                        Votre demande d'inscription a bien été modifiée
                    </h2>
                    <p className="h4 mb-5">Nous avons bien pris en compte les modifications de votre demande
                        d'inscription.</p>
                    <div className="d-flex justify-content-end mt-5">
                        <button className="btn text-white"
                                style={{
                                    backgroundColor: "#00334A",
                                    borderRadius: "8px",
                                    fontWeight: "bold"
                                }}
                        onClick={() => handleConfirmationModal()}
                        >
                            Voir mes demandes
                        </button>
                    </div>
                </div>


            </Modal>

        </div>

    )
}
