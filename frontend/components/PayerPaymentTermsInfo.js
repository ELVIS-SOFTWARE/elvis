import React, {Fragment} from "react";
import ToggleButtonGroup from "./ToggleButtonGroup";

export default function PayerPaymentTermsInfo({availPaymentScheduleOptions})
{
    availPaymentScheduleOptions.sort((a, b) => a.index - b.index);

    return <div className="ibox">
        <div className="ibox-title">
            <h3>Modalités de paiement</h3>
        </div>
        <div className="ibox-content">
            <div className="container">
                <div className="row">
                    <div className="col-sm-12">
                        Nous proposons {availPaymentScheduleOptions.length} {availPaymentScheduleOptions.length > 1 ? "options" : "option"} d'échéancier de paiement :
                    </div>
                </div>

                <div className="row mt-3">
                    {availPaymentScheduleOptions.map((paymentScheduleOption, index) =>
                        <div key={index} className="col-sm-12 border-bottom py-3 " >
                            {paymentScheduleOption.label}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
}