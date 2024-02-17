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
                payment_terms_id: props.paymentTerms.payment_terms_id,
                day_for_collection: props.paymentTerms.day_for_collection,
                payment_method_id: props.paymentTerms.payment_method_id,
            },
        };
    }


    isValidated() {
        if (this.props.informationalStepOnly)
            return true;

        if (this.state.paymentTerms.day_for_collection != null &&
            !!this.state.paymentTerms.payment_terms_id &&
            !!this.state.paymentTerms.payment_method_id)
            return true;
        else {
            toast.error(MESSAGES.err_must_select_payment_terms, { autoClose: 3000 });
            return false;
        }
    }

    handleChangePaymentTerms(paymentTermsId) {
        this.setState(prevState => {
            return {
                paymentTerms: {
                    ...prevState.paymentTerms,
                    payment_terms_id: paymentTermsId,
                },
            };
        });
        this.props.onChangePaymentTerms && this.props.onChangePaymentTerms(paymentTermsId);
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

            {this.props.informationalStepOnly ? (
                this.props.availPaymentTerms && this.props.availPaymentTerms.length > 0 && <PayerPaymentTermsInfo
                    availPaymentTerms={this.props.availPaymentTerms}
                />
            ) : (
                <PayerPaymentTerms
                    paymentTerms={this.props.paymentTerms}
                    availPaymentTerms={this.props.availPaymentTerms}
                    availPaymentMethods={this.props.availPaymentMethods}
                    onChangePaymentTerms={this.handleChangePaymentTerms.bind(this)}
                    onChangeDayForCollection={this.handleChangeDayForCollection.bind(this)}
                    onChangePaymentMethod={this.handleChangePaymentMethod.bind(this)}
                />
            )
            }


            {this.props.paymentStepDisplayText && <div className="alert alert-info w-100 pre-wrap">
                {<Editor editorState={editorState} readOnly={true} />}
            </div>}
        </Fragment>;
    }
}

WrappedPayerPaymentTerms.propTypes = {
    paymentTerms: PropTypes.shape({
        payment_terms_id: PropTypes.number,
        day_for_collection: PropTypes.number,
        payment_method_id: PropTypes.number,
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
