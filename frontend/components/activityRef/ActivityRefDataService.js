import DataService from "../common/baseDataTable/DataService";
import * as api from "../../tools/api";

export default class ActivityRefDataService extends DataService
{
    constructor(activity_ref_id, packs) {
        super("/activity_ref_pricings");

        this.activity_ref_id = activity_ref_id;
        this.packs = packs;
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
                        activity_ref_id: this.activity_ref_id
                    }
                );
        });
    }

    createData(data) {
        data.activity_ref_id = this.activity_ref_id;
        return new Promise((resolve, reject) => {
            api.set()
                .success(resolve)
                .error(reject)
                .post(`${this.urlRootData}`, data);
        });
    }

    deleteData(activity_ref_pricing) {
        const isInUse = this.packs.some(pack => pack.activity_ref_pricing_id === activity_ref_pricing.id);

        return new Promise((resolve, reject) => {
            if (isInUse) {
                reject({
                    status: 400,
                    message: "Cette tarification est utilisée par un ou plusieurs élève(s). Vous ne pouvez pas la supprimer."
                });
            } else {
                api.set()
                    .success(resolve)
                    .error(reject)
                    .del(`${this.urlRootData}/${activity_ref_pricing.id}`);
            }
        });
    }

}