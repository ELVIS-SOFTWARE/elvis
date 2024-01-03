import React, { Fragment, useEffect, useState } from "react";
import PropTypes from "prop-types";

/**
 *
 * @param {*} param0 tabs, an array containing four key-values: id, header, active (bool), mode ("buttons" / "classic") and body
 */
export default function TabbedComponent({ tabs: tabsProps , mode: modeProps, defaultActiveTab = 0 }) {
    const [tabs, setTabs] = useState([]);

    useEffect(() => {
        const activeTabs = tabsProps.map((t, i) => {
            return {
                ...t,
                active: (tabs && tabs[i] ? tabs[i].active || false : t.active === undefined ? i === defaultActiveTab : t.active)
            }
        });
        setTabs(activeTabs);
    }, [tabsProps]);

    const handleTabClick = (idx) => {
        const newTabs = tabs.map((t, i) => ({ ...t, active: i === idx }));
        setTabs(newTabs);
    };

    const mode = modeProps || "classic";

    return (
        <Fragment>
            <div className={`${mode === "classic" ? "tabs-container" : ""}`}>
                <ul
                    className={`flex ${mode === "classic" ? "nav nav-tabs" : "bg-light-blue flex no-padding"}`}
                    role="tablist"
                >
                    {tabs.map((t, i) => (
                        <li
                            key={i}
                            style={{ height: "auto" }}
                            className={`${mode === "classic" ? "" : "btn btn-primary btn_slider"} ${t.active ? "active" : ""}`}
                            onClick={t.headerHandler || (() => {})}
                        >
                            <a
                                className={`${mode === "classic" ? "nav-link " : "text-"} ${t.active ? "active" : ""}`}
                                data-toggle={!t.headerHandler && "tab"}
                                onClick={() => handleTabClick(i)}
                                style={t.headerStyle || {}}
                                href={`#${t.id}`}
                            >
                                {t.header}
                            </a>
                        </li>
                    ))}
                </ul>
                <div className="tab-content">
                    {
                        tabs.map((t, i) => <div
                            key={i}
                            id={t.id}
                            className={`tab-pane ${t.active ? "active" : ""}`}
                            role="tabpanel">
                            <div className={`panel-body ${mode === "classic" ? "" : "no-padding"}`}>
                                {t.active && t.body}
                            </div>
                        </div>)
                    }
                </div>
            </div>
        </Fragment>
    );
}

TabbedComponent.propTypes = {
    tabs: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        active: PropTypes.bool,
        headerHandler: PropTypes.func,
        headerStyle: PropTypes.object,
        header: PropTypes.node.isRequired,
        body: PropTypes.node.isRequired,
    })),
};
