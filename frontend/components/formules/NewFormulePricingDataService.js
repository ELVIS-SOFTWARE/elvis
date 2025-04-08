import DataService from "../common/baseDataTable/DataService";
import * as api from "../../tools/api";

export default class NewFormulePricingDataService extends DataService
{
    constructor(handleSavePricingForNewFormule, handleUpdatePricingForNewFormule, handleDeletePricingForNewFormule, forumulePricings, pricing_categories) {
        super("/formule_pricings");

        this.handleSavePricingForNewFormule = handleSavePricingForNewFormule;
        this.handleUpdatePricingForNewFormule = handleUpdatePricingForNewFormule;
        this.handleDeletePricingForNewFormule = handleDeletePricingForNewFormule;

        this.pricing_categories = pricing_categories || [];
        this.forumulePricings = forumulePricings || [];
        this.tempIdCounter = 1;

        this.createData = this.createData.bind(this);
    }

    listData(filter, format) {
        return new Promise((resolve, reject) => {

            return resolve({
                data: this.forumulePricings,
                pages: 1,
                total: this.forumulePricings.length
            });
        });
    }

    updateData(data) {
        // console.log(data)
        const updatedPricing = {
            "id": data.id,
            "price": data.price,
            "from_season_id": data.fromSeason.value,
            "to_season_id": data.toSeason.value,
            "pricing_category": {
                "id": data.pricing_category.id,
                "name": data.pricing_category.name
            }
        };

        let index = this.forumulePricings.findIndex(arp => arp.id === data.id);
        this.forumulePricings[index] = updatedPricing;

        // update the state of the parent component
        this.handleUpdatePricingForNewFormule(updatedPricing);

        return new Promise((resolve, reject) => {
            return resolve({
                    data: updatedPricing
                }
            );
        });
    }

    createData(data) {
        let pc = this.pricing_categories.find(pc => pc.name === data.name.label);

        const newPricing = {
            "id": this.tempIdCounter++, // temporary id
            "price": data.price,
            "from_season_id": data.fromSeason.value,
            "to_season_id": data.toSeason ? data.toSeason.value : null,
            "pricing_category": {
                "id": pc.id,
                "name": pc.name,
            }
        };

        // add to pricing_categories the new pricing
        this.forumulePricings.push(newPricing);

        // update the state of the parent component
        this.handleSavePricingForNewFormule(newPricing);

        return new Promise((resolve, reject) => {
            return resolve({
                data: newPricing
            });
        });
    }

    deleteData(data) {
        let index = this.forumulePricings.findIndex(arp => arp.id === data.id);
        this.forumulePricings.splice(index, 1);

        // update the state of the parent component
        this.handleDeletePricingForNewFormule(data);

        return new Promise((resolve, reject) => {
            return resolve({
                    data: this.forumulePricings
                }
            );
        });
    }
}