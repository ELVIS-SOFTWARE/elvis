import React, {Fragment} from "react";
import PayerPaymentTerms from "./PayerPaymentTerms";
import PropTypes from "prop-types";
import PayerPaymentTermsInfo from "./PayerPaymentTermsInfo";
import {Editor, EditorState, convertFromRaw, ContentState} from "draft-js";

class WrappedPayerPaymentTerms extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            paymentTerms: this.props.paymentTerms,
            availPaymentTerms: this.props.availPaymentTerms,
        };
    }

    isValidated() {
        // return this.props.paymentTerms.day_for_collection !== undefined && this.props.paymentTerms.day_for_collection !== null;
        return true;
    }

    handleChangePaymentTerms(paymentTermsId) {
        this.props.paymentTerms.payment_terms_id = paymentTermsId;
        this.props.onChangePaymentTerms && this.props.onChangePaymentTerms(paymentTermsId);
    }

    handleChangeDayForCollection(dayIndex) {
        this.props.collection.day_for_collection = dayIndex;
        this.props.onChangeDayForCollection && this.props.onChangeDayForCollection(dayIndex);
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

            {/*For now (30/05/2023), don't use editable payment terms. Only show information step */}
            {/*<PayerPaymentTerms*/}
            {/*    paymentTerms={this.props.paymentTerms}*/}
            {/*    availPaymentTerms={this.props.availPaymentTerms}*/}
            {/*    onChangePaymentTerms={this.handleChangePaymentTerms.bind(this)}*/}
            {/*    onChangeDayForCollection={this.handleChangeDayForCollection.bind(this)}*/}
            {/*/>*/}

            {this.props.availPaymentTerms && this.props.availPaymentTerms.length > 0 && <PayerPaymentTermsInfo
                availPaymentTerms={this.props.availPaymentTerms}
            />}

            {this.props.paymentStepDisplayText && <div className="alert alert-info w-100 pre-wrap" >
                {<Editor editorState={editorState} readOnly={true} />}
            </div>}
        </Fragment>
    }
}

WrappedPayerPaymentTerms.propTypes = {
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
    paymentStepDisplayText: PropTypes.string,
    onChangePaymentTerms: PropTypes.func,
    onChangeDayForCollection: PropTypes.func
}

export default WrappedPayerPaymentTerms;
