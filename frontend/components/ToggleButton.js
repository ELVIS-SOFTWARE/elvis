import React, {useEffect, useState} from "react";

export default function ToggleButton({children, index, onClick, status, divStyle, divClasses}) {
    const [isActive, setIsActive] = useState(status ? status.active : false);

    const buttonStyles = {
        selected: {
            boxShadow: "0 0 2px 2px #0079bf"
        },
        unselected: {

        }
    }
    const activeStatus = status && status.active;

    useEffect( () => setIsActive(status && status.active),
        [activeStatus]
    );

    function handleClick() {

        if(onClick && typeof onClick === 'function')
        {
            if(!onClick(index, !isActive))
                return;
        }

        if(status) {
            status.active = !status.active;
        }
        setIsActive(!isActive);
    }

    return <div
        className={`toggle-button ${divClasses || ""}`}
        style={{...(divStyle || {}), ...(isActive ? buttonStyles.selected : buttonStyles.unselected)}}
        onClick={handleClick}
    >
        {children}
    </div>
}