import React, {Fragment} from "react";
import {Field} from "react-final-form";
import Input from "../../common/Input";
import {required, minLength, minValue, maxValue, composeValidators} from "../../../tools/validators";
import checkbox from "../../common/Checkbox";

export default class PricingCategoryFormContent extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Fragment>
                <div className="row">
                    <div className="col">
                        <Field
                            label="Nom de la catégorie de prix"
                            name="name"
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
                            label="Nombre de leçons"
                            name="number_lessons"
                            type="number"
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
                            label="Est un pack ?"
                            name="is_a_pack"
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
