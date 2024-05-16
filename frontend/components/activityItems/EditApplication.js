import React from "react";
import {useState} from "react";
import Modal from "react-modal";
import * as api from "../../tools/api";
import swal from "sweetalert2";

export default function EditApplication(props) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [editInput, setEditInput] = useState("");

    function handleCloseEditModal() {
        setIsEditModalOpen(!isEditModalOpen);
    }

    function handleCloseConfirmationModal() {
        setIsConfirmationModalOpen(!isConfirmationModalOpen);
    }

    return (
        <div>
            <button className="btn text-white"
                    style={{
                        backgroundColor: "#00334A",
                        borderRadius: "8px",
                        fontWeight: "bold"
                    }}
                    onClick={() => handleCloseEditModal()}
            >
               <i className="fas fa-comment"></i>
            </button>

            <Modal
                isOpen={isEditModalOpen}
                onRequestClose={() => handleCloseEditModal()}
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
                        Ajouter un commentaire sur votre demande
                    </h2>
                    <div className="content" style={{height: "200px"}}>
                        <textarea id="editInput" name="editInput" style={{width: "100%", height: "100%"}} wrap="soft"
                                  onChange={(e) => setEditInput(e.target.value)}
                                  placeholder="Indiquer les modifications à nous communiquer (disponibilité, choix professeur)"></textarea>
                    </div>
                    <div className="d-flex justify-content-end mt-5">
                        <button className="btn text-white"
                                style={{
                                    backgroundColor: "#00334A",
                                    borderRadius: "8px",
                                    fontWeight: "bold"
                                }}
                                onClick={() => {
                                    if (editInput === "") {
                                        swal.fire({
                                            title: "Veuillez renseigner les modifications à apporter",
                                            icon: "info",
                                            confirmButtonColor: "#00334A",
                                            confirmButtonText: "OK"
                                        });
                                        return;
                                    }

                                    props.handleProcessModifyApplication(editInput);
                                    handleCloseEditModal();
                                    handleCloseConfirmationModal();
                                }}
                        >
                            Modifier
                        </button>
                    </div>
                </div>

            </Modal>

            <Modal
                isOpen={isConfirmationModalOpen}
                onRequestClose={() => handleCloseConfirmationModal()}
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
                                onClick={() => handleCloseConfirmationModal()}
                        >
                            Voir mes demandes
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
