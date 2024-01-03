import React from "react";
import { ToastContainer, toast } from "react-toastify";

class Toaster extends React.Component {
    render() {
        return (
            <ToastContainer
                className="toast-container"
                autoClose={false}
                draggable={false}
            />
        );
    }
}

export default Toaster;
