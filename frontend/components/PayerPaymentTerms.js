import React, {Fragment, useEffect, useState} from "react";
import PropTypes from "prop-types";
import ToggleButtonGroup from "./ToggleButtonGroup";
import Checkbox from "./common/Checkbox";
import {Field, Form} from "react-final-form";
import Input from "./common/Input";

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
                console.log("selectedPayers", selectedPayers, "type", typeof selectedPayers);
                //debugger
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

function PayerIdentificationNumber({
                                       family,
                                       user,
                                       selectedPayers,
                                   }) {
    const family_with_user = [...family, user];

    return (
        <div>
            {family_with_user.filter(user => selectedPayers.includes(user.id)).map(user => {
                console.log("user", user);
                    return (
                        <div key={user.id} className="form-group">
                            <h3 className="font-weight-bold mb-4" style={{color: "#8AA4B1"}}>Numéro national
                                d'identification
                                de {user.first_name} {user.last_name}</h3>
                            <input
                                name={`identification_number_${user.id}`}
                                type="text"
                                placeholder="85 07 30 033 28"
                                defaultValue={user.identification_number || ""}
                                className="w-100"
                                style={{borderRadius: "8px", border: "0", height: "32px", padding: "6px 12px"}}
                                required
                            />
                        </div>
                    );
                }
            )}
        </div>
    );
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
                                          }) {

    const [scheduleOptionChanged, setScheduleOptionChanged] = useState(paymentTerms.day_for_collection === undefined);
    const [selectedPaymentTermsId, setSelectedPaymentTermsId] = useState(paymentTerms.payment_schedule_options_id || 0);
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(paymentTerms.payment_method_id || 0);
    const [selectedDaysForCollection, setSelectedDaysForCollection] = useState(paymentTerms.day_for_collection !== undefined ? [paymentTerms.day_for_collection] : []);
    const [selectedPayers, setSelectedPayers] = useState(initialSelectedPayers);
    // const [requiredIdentificationNumber, setRequiredIdentificationNumber] = useState(displayIdentificationNumber && userIsMinor(user.birthday));

    const selectedPaymentTerms = getSelectedPaymentTerms();
    const availableChoices = selectedPaymentTerms ? selectedPaymentTerms.available_payments_days.length : 0;


    // function userIsMinor(birthday) {
    //     const today = new Date();
    //     const birthDate = new Date(birthday);
    //     let age = today.getFullYear() - birthDate.getFullYear();
    //     const m = today.getMonth() - birthDate.getMonth();
    //     if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    //         age--;
    //     }
    //     return age < 18;
    // }

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
        const payers = _.uniq([...selectedPayers, newSelectedPayers]);
        setSelectedPayers(payers);
        onChangePayers && onChangePayers(payers);
    }

    function handleRemovePayer(newSelectedPayers) {
        const payers = selectedPayers.filter(payer => payer !== newSelectedPayers);
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

    // useEffect(() => {
    //     const isMinor = userIsMinor(user.birthday);
    //     setRequiredIdentificationNumber(displayIdentificationNumber && isMinor);
    // }, [displayIdentificationNumber, user.birthday]);

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
                                    <h3 className="font-weight-bold mb-4" style={{color: "#8AA4B1"}}>Modalités de
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
                                        <h3 className="font-weight-bold m-2" style={{color: "#8AA4B1"}}>Date de
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
                                <h3 className="font-weight-bold" style={{color: "#8AA4B1"}}>Moyens de paiement</h3>
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
                    <h3 className="font-weight-bold" style={{color: "#8AA4B1"}}>Payeur(s)</h3>
                    <PayersListEditor
                        user={user}
                        selectedPayers={selectedPayers}
                        family={family}
                        onAddPayer={handleAddPayer}
                        onRemovePayer={handleRemovePayer}
                    />
                </div>
                {displayIdentificationNumber &&

                    <div className="col-md-6 p-0 mb-5">
                        <PayerIdentificationNumber
                            family={family}
                            user={user}
                            selectedPayers={selectedPayers}
                        />
                    </div>

                }

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