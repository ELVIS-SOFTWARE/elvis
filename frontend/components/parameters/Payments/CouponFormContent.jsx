import React, {Fragment} from "react";
import {Field} from "react-final-form";
import Input from "../../common/Input";
import {required, minLength, minValue, maxValue, composeValidators} from "../../../tools/validators";
import checkbox from "../../common/Checkbox";

export default class CouponFormContent extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Fragment>
                <div className="row">
                    <div className="col">
                        <Field
                            label="Nom du taux de remise"
                            name="label"
                            type="text"
                            required
                            validate={composeValidators(required, minLength(3))}
                            render={Input}
                        />
                    </div>
                </div>

                <div className="row">
                    <div className="col">
                        <Field
                            label="Taux de remise (%)"
                            name="percent_off"
                            type="number"
                            disabled={this.props.isUpdate}
                            required
                            validate={composeValidators(required, minValue(0), maxValue(100))}
                            render={Input}
                        />
                    </div>
                </div>

                <div className="row">
                    <div className="col">
                        <Field
                            id="enabled"
                            label="Activé"
                            name="enabled"
                            type="checkbox"
                            required
                            render={checkbox}
                        />
                    </div>
                </div>
            </Fragment>
        );
    }
}
