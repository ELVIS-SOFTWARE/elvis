import React from "react";
import {useState} from "react";


export default function EditApplication (props) {
    // useState pour ouvrir la modal
    const [isEditModalOpen, setIsEditModalOpen]= useState(false);

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
            >Modifier</button>

        </div>

        )
}
