import React, {Fragment, useEffect, useState} from "react";
import PropTypes from "prop-types";
import ToggleButtonGroup from "./ToggleButtonGroup";
import Checkbox from "./common/Checkbox";
import {composeValidators, isEmpty, isValidNN, required} from "../tools/validators";
import Input from "./common/Input";
import {Field} from "react-final-form";

function PayersListEditor({
                              user,
                              selectedPayers,
                              family,
                              onAddPayer,
                              onRemovePayer,
                              displayIdentificationNumber,
                              onChangeIdentificationNumber,
                              isMinor
                          }) {

    const family_with_user = [...family, user];
    return <Fragment>
        {family_with_user.map(user => {
                //console.log("selectedPayers", selectedPayers, "type", typeof selectedPayers);
                //debugger
                const isSelected = selectedPayers.includes(user.id);

                return <div className="row" key={user.id}>
                    <div className="col-xs-12 col-md-auto">
                        <Checkbox
                            id={user.id}
                            name="payer_id"
                            label={`${user.first_name} ${user.last_name}`}
                            input={{
                                checked: isSelected,
                                onChange: e => {
                                    if (isSelected) {
                                        onRemovePayer(user);
                                    } else {
                                        onAddPayer(user);
                                    }
                                },
                            }}
                        />
                    </div>

                    {displayIdentificationNumber && isSelected && isMinor && (
                        <div className="col-xs-12 col-md">
                            <label className="small" style={{color: "#003E5C"}}>Numéro national d'identification</label>
                            <Input
                                name={`identification_number_${user.id}`}
                                type="text"
                                className="form-control"
                                placeholder="85 07 30 033 28"
                                mask="99 99 99 999 99"
                                htmlOptions={{
                                    value: user.identification_number,
                                    onChange: e => onChangeIdentificationNumber(user, e.target.value)
                                }}
                                meta={{
                                    error: isMinor && isSelected && isEmpty((user.identification_number || "").replaceAll(/[_ ]/g, "")) ? "err_required" : null,
                                    touched: true
                                }}
                            />
                        </div>
                    )}

                </div>
            },
        )}
    </Fragment>;
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
                                              displayIdentificationNumber,
                                              onChangeIdentificationNumber,
                                              isMinor
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
        const payers = _.uniq([...selectedPayers, newSelectedPayers.id]);
        setSelectedPayers(payers);
        onChangePayers && onChangePayers(payers);
    }

    function handleRemovePayer(newSelectedPayers) {
        const payers = selectedPayers.filter(payer => payer !== newSelectedPayers.id);
        setSelectedPayers(payers);
        onChangePayers && onChangePayers(payers);
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
            {
                availPaymentMethods.length > 0 && availPaymentScheduleOptions.length > 0 ?
                    <Fragment>
                        <div className="d-sm-inline-flex justify-content-between w-100">
                            <div className="col-md-6 p-0">
                                <div className="form-group">
                                    <h3 className="mb-4" style={{color: "#8AA4B1"}}>Modalités de
                                        paiement</h3>
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
                                        <h3 className="m-2" style={{color: "#8AA4B1"}}>Date de
                                            règlement</h3>
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
                                <h3 className="" style={{color: "#8AA4B1"}}>Moyens de paiement</h3>
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
                    </Fragment> : ""
            }

            {//////////////////////////////////////////////////////////////////////////////////
                // payeurs
            }
            <div className="row ml-1">
                <div className="form-group m-t-md">
                    <h3 style={{color: "#8AA4B1"}}>Payeur(s)</h3>
                    <PayersListEditor
                        user={user}
                        selectedPayers={selectedPayers}
                        family={family}
                        onAddPayer={handleAddPayer}
                        onRemovePayer={handleRemovePayer}
                        displayIdentificationNumber={displayIdentificationNumber}
                        onChangeIdentificationNumber={onChangeIdentificationNumber}
                        isMinor={isMinor}
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