import React, {Fragment, useEffect, useState} from "react";
import UpcomingActivityInstancesList from "./upcomingActivityInstancesList";

export default function upcomingActivityInstances({user_id}) {
    return (
        <div className="d-flex flex-column ">
            <div className="mt-4">
                <h3 className="title font-bold">MON PLANNING</h3>
            </div>
            <div className="div-scrollable">
                <UpcomingActivityInstancesList user_id={user_id}/>
            </div>
        </div>
    );
}