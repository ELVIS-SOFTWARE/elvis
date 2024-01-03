import React, {Fragment, useEffect, useState} from "react";
import PropTypes from "prop-types";
import ToggleButtonGroup from "./ToggleButtonGroup";

export default function PayerPaymentTerms({
                                              paymentTerms,
                                              availPaymentTerms,
                                              onChangePaymentTerms,
                                              onChangeDayForCollection
                                          }) {

    const [selectionChanged, setSelectionChanged] = useState(paymentTerms.day_for_collection === undefined);
    const [selectedPaymentTermsId, setSelectedPaymentTermsId] = useState(paymentTerms.payment_terms_id || 0);
    const [selectedDaysForCollection, setSelectedDaysForCollection] = useState(paymentTerms.day_for_collection !== undefined ? [paymentTerms.day_for_collection] : []);
    const selectedPaymentTerms = getSelectedPaymentTerms();
    const availableChoices = selectedPaymentTerms ? selectedPaymentTerms.days_allowed_for_collection.length : 0;

    function getSelectedPaymentTerms(id = selectedPaymentTermsId) {
        return availPaymentTerms.find(
            item => item.id === id
        );
    }

    function handleSelectChange(e) {
        setSelectionChanged(true);
        paymentTerms.payment_terms_id = parseInt(e.target.value) ;
        setSelectedPaymentTermsId(paymentTerms.payment_terms_id);
        onChangePaymentTerms && onChangePaymentTerms(paymentTerms.payment_terms_id);
    }

    function handleDayChange(selectedDaysList) {
        paymentTerms.day_for_collection = selectedDaysList[0];
        onChangeDayForCollection && onChangeDayForCollection(paymentTerms.day_for_collection);
    }


    useEffect(() => {
            if (!selectionChanged)
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
            setSelectionChanged(false);
        },
        [selectedPaymentTermsId, availableChoices]
    );

    return (
        <div className="ibox">
            <div className="ibox-title">
                <h3>Modalités de paiement</h3>
            </div>
            <div className="ibox-content">

                {//////////////////////////////////////////////////////////////////////////////////
                }
                <div className="form-group">
                    <label htmlFor="payment_terms_id">Sélectionner la modalité de paiement</label>
                </div>
                <select
                    className="form-control"
                    name="payment_terms_id"
                    onChange={handleSelectChange}
                    value={selectedPaymentTermsId}
                >
                    <option key={-1} value="0">(choisissez une option)</option>
                    {availPaymentTerms.map(apt =>
                        <option key={apt.id} value={apt.id}>{apt.label}</option>
                    )}
                </select>

                {//////////////////////////////////////////////////////////////////////////////////
                }

                {selectedPaymentTerms &&
                    <Fragment>

                        <div className="form-group m-t-lg">
                            <label htmlFor="payment_terms_id">Prélèvement</label>
                            <p>Sélectionner la date de prélèvement mensuel</p>
                        </div>

                        <ToggleButtonGroup
                            multiSelect={false}
                            selected={selectedDaysForCollection}
                            childrenContent={
                                selectedPaymentTerms.days_allowed_for_collection.map((day, i) => {
                                    return <span> {day} </span>
                                })
                            }
                            onChange={handleDayChange}
                        />
                    </Fragment>
                }

            </div>
        </div>
    );

}


PayerPaymentTerms.propTypes = {
    paymentTerms: PropTypes.shape({
        payment_terms_id: PropTypes.number,
        day_for_collection: PropTypes.number
    }),
    availPaymentTerms: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            label: PropTypes.string.isRequired,
            terms_number: PropTypes.number.isRequired,
            collect_on_months: PropTypes.arrayOf(PropTypes.number).isRequired,
            days_allowed_for_collection: PropTypes.arrayOf(PropTypes.number).isRequired
        })
    ),
    onChangePaymentTerms: PropTypes.func,
    onChangeDayForCollection: PropTypes.func
}