import React, { Fragment, useEffect, useState } from "react";
import * as api from "../tools/api";
import _ from "lodash";

export default function ErrorHistory()
{
    const [errors, setErrors] = useState([]);

    useEffect(() => {
        api.set()
            .success(data =>
            {
                setErrors(data);
            })
            .get("/admin/error-history", {});
    }, []);

    return <Fragment>
        <div className="row wrapper border-bottom white-bg page-heading m-b-md">
            <h2>
                Historique des 20 dernières erreurs
            </h2>
        </div>

        <div className="wrapper wrapper-content animated fadeInRight">
            <div className="row">
                {errors.map((error, index) => {
                   return (
                       <div
                           className="col-sm-12 col-md-10 col-lg-9"
                           key={index}
                       >
                           <div className="ibox float-e-margins">
                               <div className="ibox-title">
                                   <div className="row">
                                       <div className="col-sm-2">
                                           <h3 className="label label-primary m-r-sm">
                                               {_.get(error, "error_code.code")}
                                           </h3>
                                       </div>

                                       <div className="col-sm-6">
                                           <h3>
                                               {_.get(
                                                   error,
                                                   "error_code.user_message"
                                               )}
                                           </h3>
                                       </div>

                                       <div className="col-sm-4 text-right">
                                           {new Date(
                                               error.created_at
                                           ).toLocaleString()}
                                       </div>
                                   </div>
                               </div>

                               <div className="ibox-content p-sm-0">
                                   {error.message ? <p>{error.message}</p> : ""}

                                   { Object.keys(error.related_objects).length > 0 &&
                                       <div
                                           className="panel-group m-sm-0"
                                           id={"accordion-or-" + index}
                                       >
                                           <div className="panel panel-default">
                                               <div className="panel-heading">
                                                   <h5 className="panel-title">
                                                       <a
                                                           className="w-100 d-block"
                                                           data-toggle="collapse"
                                                           data-parent={
                                                               "#accordion-or-" +
                                                               index
                                                           }
                                                           href={
                                                               "#collapse-or-" +
                                                               index
                                                           }
                                                       >
                                                           <h4>
                                                               Objects
                                                               activerecord
                                                               reliés{" "}
                                                               <span className="caret"></span>
                                                           </h4>
                                                       </a>
                                                   </h5>
                                               </div>
                                               <div
                                                   id={"collapse-or-" + index}
                                                   className="panel-collapse collapse"
                                               >
                                                   <div className="panel-body p-sm-0">
                                                       <div className="table-responsive">
                                                           <table className="table table-striped">
                                                               <thead>
                                                                   <tr>
                                                                       <th>
                                                                           Nom
                                                                           de la
                                                                           variable
                                                                       </th>
                                                                       <th>
                                                                           Class
                                                                       </th>
                                                                       <th>
                                                                           Id
                                                                       </th>
                                                                   </tr>
                                                               </thead>
                                                               <tbody>
                                                                   {Object.keys(
                                                                       error.related_objects
                                                                   ).map(
                                                                       (
                                                                           key,
                                                                           index
                                                                       ) => {
                                                                           const object =
                                                                               error
                                                                                   .related_objects[
                                                                                   key
                                                                               ];

                                                                           return (
                                                                               <tr
                                                                                   key={
                                                                                       index
                                                                                   }
                                                                               >
                                                                                   <td>
                                                                                       {
                                                                                           key
                                                                                       }
                                                                                   </td>
                                                                                   <td>
                                                                                       {
                                                                                           object.class
                                                                                       }
                                                                                   </td>
                                                                                   <td>
                                                                                       {
                                                                                           object.id
                                                                                       }
                                                                                   </td>
                                                                               </tr>
                                                                           );
                                                                       }
                                                                   )}
                                                               </tbody>
                                                           </table>
                                                       </div>
                                                   </div>
                                               </div>
                                           </div>
                                       </div>
                                   }
                               </div>

                               <div className="ibox-footer p-sm-0">
                                   <div
                                       className="panel-group"
                                       id={"accordion-st-" + index}
                                   >
                                       <div className="panel panel-default">
                                           <div className="panel-heading">
                                               <h5 className="panel-title">
                                                   <a
                                                       className="w-100 d-block"
                                                       data-toggle="collapse"
                                                       data-parent={
                                                           "#accordion-st-" +
                                                           index
                                                       }
                                                       href={
                                                           "#collapse-st-" +
                                                           index
                                                       }
                                                   >
                                                       <h4>
                                                           Stack trace{" "}
                                                           <span className="caret"></span>
                                                       </h4>
                                                   </a>
                                               </h5>
                                           </div>
                                           <div
                                               id={"collapse-st-" + index}
                                               className="panel-collapse collapse"
                                           >
                                               <div className="panel-body p-sm-0">
                                                   <div
                                                       className="px-sm-2 py-sm-3"
                                                       style={{
                                                           backgroundColor:
                                                               "rgb(49,49,56)",
                                                           color: "#c48337",
                                                       }}
                                                   >
                                                       {error.stack_trace.map(
                                                           (trace, index) => {
                                                               return (
                                                                   <div
                                                                       key={
                                                                           index
                                                                       }
                                                                       className="my-1"
                                                                   >
                                                                       <span>
                                                                           {
                                                                               trace
                                                                           }
                                                                       </span>
                                                                       <hr
                                                                           className="my-1"
                                                                           style={{
                                                                               borderColor:
                                                                                   "#505050",
                                                                           }}
                                                                       />
                                                                   </div>
                                                               );
                                                           }
                                                       )}
                                                   </div>
                                               </div>
                                           </div>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       </div>
                   );
                })}
            </div>
        </div>
    </Fragment>
}