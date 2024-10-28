import React from "react";

export default function CollapsePanel({
    id,
    header,
    children,
    collapsed = true,
    onClick = () => undefined,
    className,
}) {
    return (
        <div className={"panel " + className}>
            <div className="panel-heading">
                <h3 className="panel-title">
                    <a onClick={onClick} className="btn-block clearfix">
                        {header}
                    </a>
                </h3>
            </div>
            <div
                id={id}
                className={
                    "panel-collapse collapse " + ((collapsed && "") || "show")
                }
            >
                {collapsed || children}
            </div>
        </div>
    );
}
