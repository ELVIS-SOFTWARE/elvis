import React from "react";
import _ from "lodash";

const ActivitiesApplicationsDashboard = ({
    adherentCount,
    applicationCount,
    processedApplicationsCount,
    processingApplicationsCount,
}) => {
    return (
        <div className="m-b-sm signup-widget-list">
            <Widget
                title="Total adhérents / demandes"
                value={`${adherentCount} / ${applicationCount}`}
                small={true} />
            <Widget
                title="En attente de traitement"
                value={
                    applicationCount -
                    processedApplicationsCount -
                    processingApplicationsCount
                }
                icon="clock" />
            <Widget
                title="En cours de traitement"
                value={processingApplicationsCount}
                icon="hourglass-half" />
            <Widget
                title="Demandes traitées"
                value={processedApplicationsCount}
                icon="check" />
        </div>
    );
};

const Widget = ({ title, value, icon, small = false }) => (
    <section className={`widget signup-widget white-bg ${small ? "" : ""}`}>
        <h1 className="widget-title">{title}</h1>
        <div className="widget-content">
            <h2 className="font-bold">{value}</h2>
            {icon && <i className={`fas fa-${icon} fa-2x`} />}
        </div>
    </section>
);

export default ActivitiesApplicationsDashboard;
