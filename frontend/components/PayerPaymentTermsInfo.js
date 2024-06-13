import React, {Fragment} from "react";
import ToggleButtonGroup from "./ToggleButtonGroup";

export default function PayerPaymentTermsInfo({availPaymentScheduleOptions}) {
    availPaymentScheduleOptions.sort((a, b) => a.index - b.index);

    return <div className="row">
        <h3 className='font-weight-bold mb-5' style={{color: "#8AA4B1"}}>Type de paiement</h3>
        <div>
            <h4>
                Nous
                proposons {availPaymentScheduleOptions.length} {availPaymentScheduleOptions.length > 1 ? "options" : "option"} d'échéancier
                de paiement :
            </h4>

            <div className="mt-4">
                {availPaymentScheduleOptions.map((paymentScheduleOption, index) =>
                    <div key={index} className="col-md-5 d-inline-flex justify-content-between p-0">
                        <div className="card col mr-4"
                             style={{border: "none", borderRadius: "12px"}}>
                            <div className="row d-inline-flex align-items-center p-3">
                                <div style={{
                                    backgroundColor: "#E2EDF3",
                                    borderRadius: "50px",
                                    width: "50px",
                                    height: "50px",
                                    margin: "10px 20px 10px 10px"
                                }}>
                                </div>
                                <div>
                                    <h4 className="card-title"
                                        style={{color: "#00283B"}}>{paymentScheduleOption.label}</h4>
                                    <h6 className="card-subtitle mb-2 text-muted">... </h6>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
}