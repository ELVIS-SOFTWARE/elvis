import React, {Fragment, useEffect, useState} from "react";
import UpcomingActivityInstancesList from "./upcomingActivityInstancesList";

export default function upcomingActivityInstances() {
    return (
        <div className="d-flex flex-column ">
            <div className="mt-4">
                <h3 className="title font-bold">MON PLANNING</h3>
            </div>
            <div className="div-scrollable">
                <UpcomingActivityInstancesList/>
            </div>
        </div>
    );
}