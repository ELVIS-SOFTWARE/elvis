import React, { useState, Fragment } from "react";
import Modal from "react-modal";

export default function ButtonModal({
    label, className, count, tooltip, disabled, onClick, // BUTTON PROPS
    modalProps={}, // MODAL PROPS
    children, // MODAL CONTENT
}) {
    const [isOpen, setIsOpen] = useState(false);

    const closeModal = () => setIsOpen(false);

    const isChildrenFunction = typeof children === "function";
    const isChildrenObject = typeof children === "object";

    return <Fragment>
        <span data-tippy-content={tooltip}>
            <button
                className={className}
                disabled={disabled}
                onClick={() => {onClick && onClick(); setIsOpen(true)}}>
                {label}
                {count !== null && count !== undefined && <div className="count">{count}</div>}
            </button>
        </span>
        <Modal
            {...modalProps}
            isOpen={isOpen}
            ariaHideApp={false}
            onRequestClose={closeModal}>
            {isChildrenObject && children}
            {isChildrenFunction && children({closeModal})}
        </Modal>
    </Fragment>;
}