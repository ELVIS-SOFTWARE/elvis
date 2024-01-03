import React, {Fragment, useEffect, useState} from "react";
import * as api from "../../../tools/api";
import swal from "sweetalert2";
import moment from "moment/moment";
import UpcomingActivityInstancesList from "./upcomingActivityInstancesList";

export default function upcomingActivityInstances() {
    return (
        <Fragment>
            <div className="p-5">
                <div className="row">
                    <div className="col-md-12">
                        <h4 className="title font-bold">MES PROCHAINS COURS</h4>
                        <Fragment>
                            <div className="div-scrollable">
                                <UpcomingActivityInstancesList/>
                            </div>
                        </Fragment>
                    </div>
                </div>
            </div>
        </Fragment>
    );
}