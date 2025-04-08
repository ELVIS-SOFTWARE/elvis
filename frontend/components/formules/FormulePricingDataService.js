import DataService from "../common/baseDataTable/DataService";
import * as api from "../../tools/api";

export default class FormulePricingDataService extends DataService
{
    constructor(formule_id) {
        super(`/formules/${formule_id}/formule_pricings`);

        this.formule_id = formule_id;
    }

    listData(filter, format) {
        return new Promise((resolve, reject) => {
            api.set()
                .success(resolve)
                .error(reject)
                .post(
                    `${this.urlListData}${format ? "." + format : ""}`,
                    {
                        pageSize: filter.pageSize,
                        page: filter.page,
                        sorted: filter.sorted[0],
                        filtered: filter.filtered,
                        formule_id: this.formule_id
                    }
                );
        });
    }

    createData(data)
    {
        data.formule_id = this.formule_id;
        return new Promise((resolve, reject) => {
            api.set()
                .success(resolve)
                .error(reject)
                .post(`${this.urlRootData}`, data);
        });
    }

    updateData(data)
    {
        const {id, ...rest} = data;
        return new Promise((resolve, reject) => {
            api.set()
                .success(
                    () => {
                        data.to_season_id = data.toSeason.value || null;
                        data.from_season_id = data.fromSeason.value || null;
                        resolve(data);
                    }

                )
                .error(reject)
                .put(`${this.urlRootData}/${id}`, rest);
        });
    }

    deleteData(formule_pricing) {
        return new Promise((resolve, reject) => {
            api.set()
                .success(resolve)
                .error(reject)
                .del(`${this.urlRootData}/${formule_pricing.id}`);
        });
    }

}