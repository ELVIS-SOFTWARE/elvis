import React, { Fragment } from "react";
import PayerPaymentTerms from "./PayerPaymentTerms";
import PropTypes from "prop-types";
import PayerPaymentTermsInfo from "./PayerPaymentTermsInfo";
import { Editor, EditorState, convertFromRaw, ContentState } from "draft-js";
import { toast } from "react-toastify";
import { MESSAGES } from "../tools/constants";

class WrappedPayerPaymentTerms extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            paymentTerms: {
                payment_schedule_options_id: props.paymentTerms.payment_schedule_options_id,
                day_for_collection: props.paymentTerms.day_for_collection,
                payment_method_id: props.paymentTerms.payment_method_id,
            },
        };
    }


    isValidated() {
        if (this.props.informationalStepOnly)
            return true;

        //if(this.state.)

        if (this.props.availPaymentMethods.length === 0 || this.props.availPaymentScheduleOptions.length === 0) {
            return true; // ignore this step if no payment methods or payment schedule options
        }

        if (this.state.paymentTerms.day_for_collection != null &&
            !!this.state.paymentTerms.payment_schedule_options_id &&
            !!this.state.paymentTerms.payment_method_id)
            return true;
        else {
            toast.error(MESSAGES.err_must_select_payment_terms, { autoClose: 3000 });
            return false;
        }
    }

    handleChangePaymentTerms(paymentScheduleOptionsId) {
        this.setState(prevState => {
            return {
                paymentTerms: {
                    ...prevState.paymentTerms,
                    payment_schedule_options_id: paymentScheduleOptionsId,
                },
            };
        });
        this.props.onChangePaymentTerms && this.props.onChangePaymentTerms(paymentScheduleOptionsId);
    }

    handleChangeDayForCollection(dayIndex) {
        this.setState(prevState => {
            return {
                paymentTerms: {
                    ...prevState.paymentTerms,
                    day_for_collection: dayIndex,
                },
            };
        });
        this.props.onChangeDayForCollection && this.props.onChangeDayForCollection(dayIndex);
    }

    handleChangePaymentMethod(paymentMethodId) {
        this.setState(prevState => {
            return {
                paymentTerms: {
                    ...prevState.paymentTerms,
                    payment_method_id: paymentMethodId,
                },
            };
        });
        this.props.onChangePaymentMethod && this.props.onChangePaymentMethod(paymentMethodId);
    }

    handleChangePayers(payers) {
        this.setState(prevState => {
            return {
                payers: payers,
            };
        });
        this.props.onChangePayers && this.props.onChangePayers(payers);
    }

    render() {

        let editorState = EditorState.createEmpty();
        let savedContentRaw = null;
        let savedContentState = null;
        if (this.props.paymentStepDisplayText != null) {
            try {
                savedContentRaw = JSON.parse(this.props.paymentStepDisplayText);
                savedContentState = convertFromRaw(savedContentRaw);
            } catch (e) {
                savedContentState = ContentState.createFromText(this.props.paymentStepDisplayText);
            }
            editorState = EditorState.createWithContent(savedContentState);
        }

        return <div className="padding-page application-form">

            <div className="row">
                {this.props.paymentStepDisplayText &&
                    <div className="alert alert-info d-inline-flex align-items-center p-1 pr-3"
                         style={{ border: "1px solid #0079BF", borderRadius: "5px", color: "#0079BF" }}>
                        <div className="col-1 p-0 text-center">
                            <i className="fas fa-info-circle"></i>
                        </div>
                        <div className="col p-0">
                            {<Editor editorState={editorState} readOnly={true} />}
                        </div>
                    </div>}
            </div>


            {this.props.informationalStepOnly ? (
                this.props.availPaymentScheduleOptions && this.props.availPaymentScheduleOptions.length > 0 &&
                <PayerPaymentTermsInfo
                    availPaymentScheduleOptions={this.props.availPaymentScheduleOptions}
                />
            ) : (
                <PayerPaymentTerms
                    user={this.props.user}
                    family={this.props.family}
                    initialSelectedPayers={this.props.initialSelectedPayers || []}
                    paymentTerms={this.props.paymentTerms}
                    availPaymentScheduleOptions={this.props.availPaymentScheduleOptions}
                    availPaymentMethods={this.props.availPaymentMethods}
                    onChangePaymentTerms={this.handleChangePaymentTerms.bind(this)}
                    onChangeDayForCollection={this.handleChangeDayForCollection.bind(this)}
                    onChangePaymentMethod={this.handleChangePaymentMethod.bind(this)}
                    onChangePayers={this.handleChangePayers.bind(this)}
                />
            )
            }

        </div>;
    }
}

WrappedPayerPaymentTerms.propTypes = {
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
    availPaymentMethods: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            label: PropTypes.string.isRequired,
        }),
    ),
    paymentStepDisplayText: PropTypes.string,
    onChangePaymentTerms: PropTypes.func,
    onChangeDayForCollection: PropTypes.func,
    onChangePaymentMethod: PropTypes.func,
};

export default WrappedPayerPaymentTerms;
