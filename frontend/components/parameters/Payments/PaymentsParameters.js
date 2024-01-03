import React from "react";
import PaymentsStatus from "./PaymentsStatus";
import PaymentsMethods from "./PaymentsMethods";
import Pricings from "./Pricings";
import BaseParameters from "../BaseParameters";
import AdhesionSettings from './AdhesionSettings';
import EditPaymentTerms from "./EditPaymentTerms";
import Coupons from "./Coupons";

export default class PaymentsParameters extends BaseParameters {
    constructor(props) {
        super(props);

        this.state.tabsNames = [
            'Adhésion',
            /*'Statuts de paiements',*/
            'Méthodes de paiements',
            'Types de tarifs',
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
            <Pricings
                urlListData="/parameters/payment_parameters/list_pricings"
                urlNew="/pricings/new"
            />,
            <EditPaymentTerms />,
            <Coupons />
        ];
    }
}