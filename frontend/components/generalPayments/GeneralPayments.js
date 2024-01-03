import React from "react";

import swal from "sweetalert2";

import DuePaymentList from "./DuePaymentList";
import PaymentList from "./PaymentList";
import PaymentScheduleList from "./PaymentScheduleList";
import CheckList from "./CheckList";
import { csrfToken } from "../utils";
import TabbedComponent from "../utils/ui/tabs";

class GeneralPayments extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            mode: "DUE_PAYMENTS",
            failedCount: this.props.failedCount,
        };
    }

    render() {

        return (
            <div className="col-lg-12 page-reglement">
                <TabbedComponent tabs={[
                    {
                        id: "due_payments",
                        header: "Échéances",
                        body: <DuePaymentList
                            paymentMethods={this.props.paymentMethods}
                            locations={this.props.locations}
                            minYear={this.props.minYear}
                            maxYear={this.props.maxYear}
                            statuses={this.props.duePaymentStatuses}
                            seasons={this.props.seasons}
                            paymentStatuses={this.props.paymentStatuses}
                        />,
                        active: true,
                    },
                    {
                        id: "payments",
                        header: "Règlements",
                        body: <PaymentList
                            paymentMethods={this.props.paymentMethods}
                            locations={this.props.locations}
                            minYear={this.props.minYear}
                            maxYear={this.props.maxYear}
                            statuses={this.props.duePaymentStatuses}
                            seasons={this.props.seasons}
                            paymentStatuses={this.props.paymentStatuses}
                        />,
                    },
                    {
                        id: "schedules_without_payer",
                        header: "Échéanciers sans payeur",
                        body: <PaymentScheduleList seasons={this.props.seasons} />,
                    },
                    {
                        id: "checks",
                        header: "Chèques",
                        body: <CheckList/>,
                    },
                ]}>

                </TabbedComponent>
            </div>
        );
    }
}

export default GeneralPayments;
