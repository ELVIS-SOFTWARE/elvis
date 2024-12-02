import React, { Fragment, useEffect, useState } from "react";
import PropTypes from "prop-types";
import _ from "lodash";

/**
 *
 * @param {*} param0 tabs, an array containing four key-values: id, header, active (bool), mode ("buttons" / "classic") and body
 */
export default function TabbedComponent({ tabs: tabsProps , mode: modeProps, defaultActiveTab = 0 }) {
    tabsProps = tabsProps.filter(t => t != undefined);

    const [active, setActive] = useState(defaultActiveTab);

    const tmp = tabsProps.reduce((acc, tab) => ({ ...acc, [tab.id]: false }), {});

    const [tabErrorState, setTabErrorState] = useState(tmp);

    const propsActivated = tabsProps.findIndex(t => t.active);

    useEffect(() => {
        if (propsActivated !== -1)
            setActive(propsActivated)
    }, [propsActivated]);

    const handleTabClick = (idx) => {
        setActive(idx);
    };

    const mode = modeProps || "classic";

    return (
        <Fragment>
            <div className={`${mode === "classic" ? "tabs-container" : ""}`}>
                <ul
                    className={`flex ${mode === "classic" ? "nav nav-tabs" : "bg-light-blue flex no-padding"}`}
                    role="tablist"
                >
                    {tabsProps.map((t, i) => (
                        <li
                            key={i}
                            style={{ height: "auto" }}
                            className={`${mode === "classic" ? "" : "btn btn-primary btn_slider"} ${active === i ? "active" : ""}`}
                            onClick={t.headerHandler || (() => {})}
                            { ...(tabErrorState[t.id] || t.isInError ? { ["title"]: "Cet onglet n'est pas complêtement remplis" } : {})}
                        >
                            <a
                                className={`${mode === "classic" ? "nav-link " : "text-"} ${active === i ? "active" : ""}`}
                                data-toggle={!t.headerHandler && "tab"}
                                onClick={() => handleTabClick(i)}
                                style={{
                                    ...(t.headerStyle || {}),
                                }}
                                href={`#${t.id}`}
                            >
                                {t.header} {tabErrorState[t.id] || t.isInError ? <i className="fa fa-exclamation-circle text-danger" /> : <i className=" fa fa-check-circle text-success" />}
                            </a>
                        </li>
                    ))}
                </ul>
                <div className="tab-content">
                    {
                        tabsProps.map((t, i) => <div
                            key={i}
                            id={t.id}
                            className={`tab-pane ${active === i ? "active" : ""}`}
                            role="tabpanel">
                            <div className={`panel-body ${mode === "classic" ? "" : "no-padding"}`}>
                                {active === i && { ...t.body, props: { ...t.body.props, setTabError: isError => setTabErrorState(tabErrorState => ({ ...tabErrorState, [t.id]: isError })) } }}
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
        isInError: PropTypes.bool,
        body: PropTypes.node.isRequired,
    })),
};
