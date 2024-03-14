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
                <div className="content" style={{height: "200px"}}>
                    <textarea id="editInput" name="editInput" style={{width: "100%", height: "100%"}} wrap="soft">
                        Indiquer les modifications à nous communiquer (disponibilité, choix professeur)
                    </textarea>
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
