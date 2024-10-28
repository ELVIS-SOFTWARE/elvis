import * as api from "../../../tools/api";
import IDataService from "./IDataService";

export default class DataService extends IDataService
{
    constructor(urlRootData, urlListData) {
        super();
        this.urlRootData = urlRootData;
        this.urlListData = urlListData ? urlListData : `${urlRootData}/list`;
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
                    }
                );
        });
    }

    updateData(data) {
        const {id, ...rest} = data;
        return new Promise((resolve, reject) => {
            api.set()
                .success(resolve)
                .error(reject)
                .put(`${this.urlRootData}/${id}`, rest);
        });
    }

    createData(data) {
        return new Promise((resolve, reject) => {
            api.set()
                .success(resolve)
                .error(reject)
                .post(`${this.urlRootData}`, data);
        });
    }

    deleteData(data) {
        return new Promise((resolve, reject) => {
            api.set()
                .success(resolve)
                .error(reject)
                .del(`${this.urlRootData}/${data.id}`);
        });
    }
}
