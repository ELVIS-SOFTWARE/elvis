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
                payers: payers
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

        return <Fragment>

            {this.props.paymentStepDisplayText && <div className="alert alert-info w-100 pre-wrap">
                {<Editor editorState={editorState} readOnly={true} />}
            </div>}

            {this.props.informationalStepOnly ? (
                this.props.availPaymentScheduleOptions && this.props.availPaymentScheduleOptions.length > 0 &&
                <PayerPaymentTermsInfo
                    availPaymentScheduleOptions={this.props.availPaymentScheduleOptions}
                />
            ) : (
                <PayerPaymentTerms
                    user={this.props.user}
                    family={this.props.family}
                    initialSelectedPayers={this.props.initialSelectedPayers}
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


        </Fragment>;
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
