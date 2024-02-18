import React, { Fragment } from "react";
import Input from "../common/Input";
import { required } from "../../tools/validators";
import { Field } from "react-final-form";
import Select from "react-select";

export default class ActivityRefPricingModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            pricingCategories: [],
            seasons: [],
            selectedPricingCategory: null,
            selectedFrom: null,
            selectedTo: null,
        }
    }

    componentDidMount() {
        const { seasons, pricingCategories, isUpdate, item } = this.props;

        const mappedSeasons = seasons
            .map(season => ({ value: season.id, label: season.label }))
            .sort((a, b) => a.label.localeCompare(b.label));
        const mappedPricingCategories = pricingCategories.map(pricingCategory => ({
            value: pricingCategory.id,
            label: pricingCategory.name
        }));

        this.setState({ seasons: mappedSeasons, pricingCategories: mappedPricingCategories });

        if (isUpdate) {
            const selectedPricingCategory = this.findSelectedOption(mappedPricingCategories, item.pricing_category.id);
            const selectedFrom = this.findSelectedOption(mappedSeasons, item.from_season_id);
            const selectedTo = this.findSelectedOption(mappedSeasons, item.to_season_id);

            this.setState({ selectedPricingCategory, selectedFrom, selectedTo });
        }
    }


    ReactSelectAdapter = ({ input, ...rest }) => (
        <Select {...input} {...rest} searchable required />
    );

    findSelectedOption = (options, value) => {
        return options.find(option => option.value === value) || null;
    };

    render() {
        const { pricingCategories, seasons, selectedPricingCategory, selectedFrom, selectedTo} = this.state;
        const { isUpdate } = this.props;

        if (isUpdate) {
            if (!selectedPricingCategory || !selectedFrom) {
                return "loading";
            }
        }

        return (
            <Fragment>
                <div className="mt-3">
                    <label className="ml-4">Type de tarif :</label>
                    <Field
                        label="Choisir une catégorie de tarif"
                        name="name"
                        type="text"
                        component={this.ReactSelectAdapter}
                        render={Input}
                        className="col-12"
                        isDisabled={this.props.isUpdate}
                        options={pricingCategories}
                        defaultValue={selectedPricingCategory}
                        placeholder="sélectionner une catégorie de tarif"
                    />
                </div>

                <div className="pl-4 col-12 mt-3">
                    <label>Prix</label>
                    <Field
                        name="price"
                        type="text"
                        validate={required}
                        render={Input}
                    />
                </div>

                <div className="mt-3">
                    <label className="ml-4">à partir de :</label>
                    <Field
                        className="col-12"
                        name="fromSeason"
                        component={this.ReactSelectAdapter}
                        options={seasons}
                        required
                        defaultValue={selectedFrom}
                        maxMenuHeight={100}
                        placeholder="sélectionner une saison"
                    />
                </div>

                <div className="mt-3 mb-5">
                    <label className="ml-4">jusqu'à (optionnel) :</label>
                    <Field
                        className="col-12"
                        name="toSeason"
                        component={this.ReactSelectAdapter}
                        options={seasons}
                        defaultValue={selectedTo}
                        maxMenuHeight={100}
                        placeholder="sélectionner une saison"
                    />
                </div>
            </Fragment>
        );
    }
}
