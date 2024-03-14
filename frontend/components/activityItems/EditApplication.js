import React from "react";
import {useState} from "react";
import swal from "sweetalert2";
import Modal from "react-modal";

export default function EditApplication(props) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    function handleEditModal() {
        setIsEditModalOpen(!isEditModalOpen);
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
                className="modal-xl"
                ariaHideApp={false}
                contentLabel="Modifier votre inscription"
                style={{
                    content: {
                        width: "700px" // Agrandir la modal à 700px
                    }
                }}
            >
                <h2 className="modal-header mb-5" style={{color: "#00334A"}}>
                    Modifier votre demande d'inscription
                </h2>
                <div className="content">
                    <input type="text" id="editInput" name="editInput"
                           style={{
                               width: "100%", // Ajuster la largeur à 100% pour occuper toute la largeur de la modal
                               height: "200px",
                               textAlign: "left"
                           }}
                           placeholder="Indiquer les modifications à nous communiquer (disponibilité, choix professeur)"
                           wrap="soft" // Permettre le retour automatique du texte du placeholder
                    />
                </div>
                <div className="d-flex justify-content-end mt-5">
                    <button className="btn text-white"
                            style={{
                                backgroundColor: "#00334A",
                                borderRadius: "8px",
                                fontWeight: "bold"
                            }}>
                        Modifier
                    </button>
                </div>

            </Modal>

        </div>

    )
}
