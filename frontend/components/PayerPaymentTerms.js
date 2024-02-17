import React, { Fragment, useEffect, useState } from "react";
import PropTypes from "prop-types";
import ToggleButtonGroup from "./ToggleButtonGroup";

export default function PayerPaymentTerms({
                                              paymentTerms,
                                              availPaymentTerms,
                                              availPaymentMethods,
                                              onChangePaymentTerms,
                                              onChangeDayForCollection,
                                              onChangePaymentMethod,
                                          }) {

    const [scheduleOptionChanged, setScheduleOptionChanged] = useState(paymentTerms.day_for_collection === undefined);
    const [selectedPaymentTermsId, setSelectedPaymentTermsId] = useState(paymentTerms.payment_terms_id || 0);
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(paymentTerms.payment_method_id || 0);
    const [selectedDaysForCollection, setSelectedDaysForCollection] = useState(paymentTerms.day_for_collection !== undefined ? [paymentTerms.day_for_collection] : []);
    const selectedPaymentTerms = getSelectedPaymentTerms();
    const availableChoices = selectedPaymentTerms ? selectedPaymentTerms.days_allowed_for_collection.length : 0;

    function getSelectedPaymentTerms(id = selectedPaymentTermsId) {
        return availPaymentTerms.find(
            item => item.id === id,
        );
    }

    function handleScheduleOptionChange(e) {
        setScheduleOptionChanged(true);
        paymentTerms.payment_terms_id = parseInt(e.target.value);
        setSelectedPaymentTermsId(paymentTerms.payment_terms_id);
        onChangePaymentTerms && onChangePaymentTerms(paymentTerms.payment_terms_id);
    }

    function handleSelectMethodChange(e) {
        paymentTerms.payment_method_id = parseInt(e.target.value);
        setSelectedPaymentMethodId(paymentTerms.payment_method_id);
        onChangePaymentMethod && onChangePaymentMethod(paymentTerms.payment_method_id);
    }

    function handleDayChange(selectedDaysList) {
        paymentTerms.day_for_collection = selectedDaysList[0];
        onChangeDayForCollection && onChangeDayForCollection(paymentTerms.day_for_collection);
    }

    useEffect(() => {
            if (!scheduleOptionChanged)
                return;

            if (selectedPaymentTerms) {
                if (availableChoices === 1) {
                    setSelectedDaysForCollection([0]);
                    handleDayChange([0]);
                } else {
                    setSelectedDaysForCollection([]);
                    handleDayChange([]);
                }
            }
            setScheduleOptionChanged(false);
        },
        [selectedPaymentTermsId, availableChoices],
    );

    return (
        <div className="ibox">
            <div className="ibox-title">
                <h3>Modalités de paiement</h3>
            </div>
            <div className="ibox-content">

                {//////////////////////////////////////////////////////////////////////////////////
                    // échéancier
                }
                <div className="form-group m-t-md">
                    <label htmlFor="payment_terms_id">Sélectionner votre échéancier</label>
                <select
                    className="form-control"
                    name="payment_terms_id"
                    onChange={handleScheduleOptionChange}
                    value={selectedPaymentTermsId}
                >
                    <option key={-1} value="0">(choisissez une option)</option>
                    {availPaymentTerms.map(apt =>
                        <option key={apt.id} value={apt.id}>{apt.label}</option>,
                    )}
                </select>
                </div>

                {//////////////////////////////////////////////////////////////////////////////////
                    // date de paiement
                }

                {selectedPaymentTerms &&
                    <Fragment>

                        <div className="form-group m-t-lg">
                            <label htmlFor="payment_terms_id">Règlement</label>
                            <p>Sélectionner la date de règlement mensuel</p>
                        </div>

                        <ToggleButtonGroup
                            multiSelect={false}
                            selected={selectedDaysForCollection}
                            childrenContent={
                                selectedPaymentTerms.days_allowed_for_collection.map((day, i) => {
                                    return <span> {day} </span>;
                                })
                            }
                            onChange={handleDayChange}
                        />
                    </Fragment>
                }

                {//////////////////////////////////////////////////////////////////////////////////
                    // moyen de paiement
                }
                <div className="form-group m-t-md">
                    <label htmlFor="payment_method_id">Sélectionner votre moyen de paiement</label>
                    <select
                        className="form-control"
                        name="payment_method_id"
                        onChange={handleSelectMethodChange}
                        value={selectedPaymentMethodId}
                    >
                        <option key={-1} value="0">(choisissez une option)</option>
                        {availPaymentMethods.map(apm =>
                            <option key={apm.id} value={apm.id}>{apm.label}</option>,
                        )}
                    </select>
                </div>

            </div>
        </div>
    );

}


PayerPaymentTerms.propTypes = {
    paymentTerms: PropTypes.shape({
        payment_terms_id: PropTypes.number,
        day_for_collection: PropTypes.number,
    }),
    availPaymentTerms: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            label: PropTypes.string.isRequired,
            terms_number: PropTypes.number.isRequired,
            collect_on_months: PropTypes.arrayOf(PropTypes.number).isRequired,
            days_allowed_for_collection: PropTypes.arrayOf(PropTypes.number).isRequired,
        }),
    ),
    onChangePaymentTerms: PropTypes.func,
    onChangeDayForCollection: PropTypes.func,
};