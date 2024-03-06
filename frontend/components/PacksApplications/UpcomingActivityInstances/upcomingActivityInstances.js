import React, {Fragment, useEffect, useState} from "react";
import UpcomingActivityInstancesList from "./upcomingActivityInstancesList";

export default function upcomingActivityInstances() {
    return (
        <Fragment>
            <div className="d-flex flex-column ">
                <div className="mt-4">
                    <h3 className="title font-bold">MON PLANNING</h3>
                </div>
                <Fragment>
                    <div className="div-scrollable">
                        <UpcomingActivityInstancesList/>
                    </div>
                </Fragment>

            </div>
        </Fragment>
    );
}