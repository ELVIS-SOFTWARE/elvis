import React from "react";
import PaymentsMethods from "./PaymentsMethods";
import BaseParameters from "../BaseParameters";
import AdhesionSettings from './AdhesionSettings';
import EditPaymentScheduleOptions from "./EditPaymentScheduleOptions";
import Coupons from "./Coupons";
import PricingCategoriesEdit from "../Activities/PricingCategoriesEdit";

export default class PaymentsParameters extends BaseParameters {
    constructor(props) {
        super(props);

        this.state.tabsNames = [
            'Adhésion',
            /*'Statuts de paiements',*/
            'Moyens de paiements',
            'Catégories de prix',
            'Modalités de paiement',
            'Taux de remise'
        ];

        this.state.divObjects = [
            <AdhesionSettings/>,
            // caché pour le moment, plus d'intérêt dans l'immédiat (05/07/2023)
            // <PaymentsStatus
            //     urlListData="/parameters/payment_parameters/list_status"
            //     urlNew="/payment_statuses/new"
            // />,
            <PaymentsMethods
                urlListData="/parameters/payment_parameters/list_methods"
                urlNew="/payment_method/new"
            />,
            <PricingCategoriesEdit />,
            <EditPaymentScheduleOptions />,
            <Coupons />
        ];
    }
}