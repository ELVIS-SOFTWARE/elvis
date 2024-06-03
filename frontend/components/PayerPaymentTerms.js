import React, {Fragment, useEffect, useState} from "react";
import PropTypes from "prop-types";
import ToggleButtonGroup from "./ToggleButtonGroup";
import Checkbox from "./common/Checkbox";

function PayersListEditor({
                              user,
                              selectedPayers,
                              family,
                              onAddPayer,
                              onRemovePayer,
                          }) {

    const family_with_user = [...family, user];
    return <div className="d-md-inline-flex">
        {family_with_user.map(user => {
                const isSelected = selectedPayers.includes(user.id);

                return <Checkbox
                    key={user.id}
                    id={user.id}
                    name="payer_id"
                    label={`${user.first_name} ${user.last_name}`}
                    input={{
                        checked: isSelected,
                        onChange: e => {
                            if (isSelected) {
                                onRemovePayer(user.id);
                            } else {
                                onAddPayer(user.id);
                            }
                        },
                    }}
                />;
            },
        )}
    </div>;
}


export default function PayerPaymentTerms({
                                              user,
                                              family,
                                              initialSelectedPayers,
                                              paymentTerms,
                                              availPaymentScheduleOptions,
                                              availPaymentMethods,
                                              onChangePaymentTerms,
                                              onChangeDayForCollection,
                                              onChangePaymentMethod,
                                              onChangePayers,
                                          }) {
    const [scheduleOptionChanged, setScheduleOptionChanged] = useState(paymentTerms.day_for_collection === undefined);
    const [selectedPaymentTermsId, setSelectedPaymentTermsId] = useState(paymentTerms.payment_schedule_options_id || 0);
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(paymentTerms.payment_method_id || 0);
    const [selectedDaysForCollection, setSelectedDaysForCollection] = useState(paymentTerms.day_for_collection !== undefined ? [paymentTerms.day_for_collection] : []);
    const [selectedPayers, setSelectedPayers] = useState(initialSelectedPayers);

    const selectedPaymentTerms = getSelectedPaymentTerms();
    const availableChoices = selectedPaymentTerms ? selectedPaymentTerms.available_payments_days.length : 0;

    function getSelectedPaymentTerms(id = selectedPaymentTermsId) {
        return availPaymentScheduleOptions.find(
            item => item.id === id,
        );
    }

    function handleScheduleOptionChange(e) {
        setScheduleOptionChanged(true);
        paymentTerms.payment_schedule_options_id = parseInt(e.target.value);
        setSelectedPaymentTermsId(paymentTerms.payment_schedule_options_id);
        onChangePaymentTerms && onChangePaymentTerms(paymentTerms.payment_schedule_options_id);
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

    function handleAddPayer(newSelectedPayers) {
        setSelectedPayers(newSelectedPayers);
        onChangePayers && onChangePayers(newSelectedPayers);
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
    }, [selectedPaymentTermsId, availableChoices]);

    return (
        <div className="row mt-4">
            {//////////////////////////////////////////////////////////////////////////////////
                // Modalités de paiement & date de paiement
            }
            <div className="d-sm-inline-flex justify-content-between w-100">
                <div className="col-md-6 p-0">
                    <div className="form-group">
                        <h3 className='font-weight-bold mb-4' style={{color: "#8AA4B1"}}>Modalités de paiement</h3>
                        <select
                            className="form-control"
                            name="payment_schedule_options_id"
                            onChange={handleScheduleOptionChange}
                            value={selectedPaymentTermsId}
                            style={{borderRadius: "8px", border: "0"}}
                        >
                            <option key={-1} value="0">Choisissez une option</option>
                            {availPaymentScheduleOptions.map(apt =>
                                <option key={apt.id} value={apt.id}>{apt.label}</option>,
                            )}
                        </select>
                    </div>
                </div>
                {selectedPaymentTerms &&
                    <div className="col-md-5 p-0">
                        <div className="form-group">
                            <h3 className='font-weight-bold m-2' style={{color: "#8AA4B1"}}>Date de règlement</h3>
                            <ToggleButtonGroup
                                multiSelect={false}
                                selected={selectedDaysForCollection}
                                childrenContent={
                                    selectedPaymentTerms.available_payments_days.map((day, i) => {
                                        return <span> {day} </span>;
                                    })
                                }
                                onChange={handleDayChange}
                                buttonClasses="p-0"
                                buttonStyles={{height: "35px", width: "35px", borderRadius: "8px"}}
                            />
                        </div>
                    </div>
                }
            </div>

            {//////////////////////////////////////////////////////////////////////////////////
                // moyen de paiement
            }
            <div className="row ml-1 mb-4">
                <div className="col-md-6 p-0 pr-3">
                        <h3 className='font-weight-bold' style={{color: "#8AA4B1"}}>Moyens de paiement</h3>
                        <select
                            className="form-control"
                            name="payment_method_id"
                            onChange={handleSelectMethodChange}
                            value={selectedPaymentMethodId}
                            style={{borderRadius: "8px", border: "0"}}
                        >
                            <option key={-1} value="0">Choisissez une option</option>
                            {availPaymentMethods.map(apm =>
                                <option key={apm.id} value={apm.id}>{apm.label}</option>,
                            )}
                        </select>
                </div>
            </div>

            {//////////////////////////////////////////////////////////////////////////////////
                // payeurs
            }
            <div className="row ml-1">
                <div className="form-group m-t-md">
                    <h3 className='font-weight-bold' style={{color: "#8AA4B1"}}>Payeur(s)</h3>
                    <PayersListEditor
                        user={user}
                        selectedPayers={selectedPayers}
                        family={family}
                        onAddPayer={handleAddPayer}
                        onRemovePayer={() => {
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

PayerPaymentTerms.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
        first_name: PropTypes.string.isRequired,
        last_name: PropTypes.string.isRequired,
    }),
    family: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            first_name: PropTypes.string.isRequired,
            last_name: PropTypes.string.isRequired,
            is_paying_for: PropTypes.bool.isRequired,
        }),
    ),
    paymentTerms: PropTypes.shape({
        payment_schedule_options_id: PropTypes.number,
        day_for_collection: PropTypes.number,
        payment_method_id: PropTypes.number,
    }),
    availPaymentScheduleOptions: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            label: PropTypes.string.isRequired,
            payments_number: PropTypes.number.isRequired,
            payments_months: PropTypes.arrayOf(PropTypes.number).isRequired,
            available_payments_days: PropTypes.arrayOf(PropTypes.number).isRequired,
        }),
    ),
    onChangePaymentTerms: PropTypes.func,
    onChangeDayForCollection: PropTypes.func,
};
