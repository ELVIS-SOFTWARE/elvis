import DataService from "../common/baseDataTable/DataService";
import * as api from "../../tools/api";

export default class ActivityRefDataService extends DataService
{
    constructor(handleSaveForNewActivity, handleUpdateForNewActivity, handleDeleteForNewActivity, activityRefPricings, pricing_categories) {
        super("/activity_ref_pricings");

        this.handleSaveForNewActivity = handleSaveForNewActivity;
        this.handleUpdateForNewActivity = handleUpdateForNewActivity;
        this.handleDeleteForNewActivity = handleDeleteForNewActivity;

        this.pricing_categories = pricing_categories;
        this.activityRefPricings = activityRefPricings;
        this.tempIdCounter = 1;

        this.createData = this.createData.bind(this);
    }

    listData(filter, format) {
        return new Promise((resolve, reject) => {

            return resolve({
                data: this.activityRefPricings,
                pages: 1,
                total: this.activityRefPricings.length
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
                "name": data.pricing_category.name,
                "number_lessons": data.pricing_category.number_lessons,
                "is_a_pack": data.pricing_category.is_a_pack,
                "created_at": data.pricing_category.created_at,
                "updated_at": data.pricing_category.updated_at
            }
        };

        // update the pricing in the activityRefPricings array
        let index = this.activityRefPricings.findIndex(arp => arp.id === data.id);
        this.activityRefPricings[index] = updatedPricing;

        // update the state of the parent component
        this.handleUpdateForNewActivity(updatedPricing);

        return new Promise((resolve, reject) => {
            return resolve({
                    data: updatedPricing
                }
            );
        });
    }

    createData(data) {
        let pc = this.pricing_categories.find(pc => pc.name === data.name.label);

        console.log(data)

        const newPricing = {
            "id": this.tempIdCounter++, // temporary id
            "price": data.price,
            "from_season_id": data.fromSeason.value,
            "to_season_id": data.toSeason ? data.toSeason.value : null,
            "pricing_category": {
                "id": pc.id,
                "name": pc.name,
                "number_lessons": pc.number_lessons,
                "is_a_pack": pc.is_a_pack,
                "created_at": pc.created_at,
                "updated_at": pc.updated_at
            }
        };

        // add to pricing_categories the new pricing
        this.activityRefPricings.push(newPricing);

        // update the state of the parent component
        this.handleSaveForNewActivity(newPricing);

        return new Promise((resolve, reject) => {
            return resolve({
                data: newPricing
            });
        });
    }

    deleteData(data) {
        // remove the pricing from the activityRefPricings array
        let index = this.activityRefPricings.findIndex(arp => arp.id === data.id);
        this.activityRefPricings.splice(index, 1);

        // update the state of the parent component
        this.handleDeleteForNewActivity(data);

        return new Promise((resolve, reject) => {
            return resolve({
                    data: this.activityRefPricings
                }
            );
        });
    }
}