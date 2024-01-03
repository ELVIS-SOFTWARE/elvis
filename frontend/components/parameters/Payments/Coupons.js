import React, {Fragment} from 'react';
import BaseDataTable from '../../common/baseDataTable/BaseDataTable';
import DefaultCreateButton from "../../common/baseDataTable/DefaultCreateButton";
import CouponsActionButtons from "./CouponsActionButtons";
import DataService from "../../common/baseDataTable/DataService";
import CouponFormContent from './CouponFormContent';

function CreateButton({onCreate}) {
    return (
        <DefaultCreateButton
            label={"Créer un taux de remise"}
            onCreate={onCreate}
        />
    );
}

export default function Coupons() {
    const columns = [
        {
            id: "id",
            Header: "Id",
            accessor: "id",
        },
        {
            id: "label",
            Header: "Nom du taux de remise",
            accessor: "label",
        },
        {
            id: "percent_off",
            Header: "Taux de remise (%)",
            accessor: "percent_off",
        },
        {
            id: "enabled",
            Header: "Actif",
            accessor: "enabled",
            Cell: ({value}) => value ? "Oui" : "Non"
        }
    ];

    return (
        <Fragment>
            <div className="row m-xs">
                <div className="col-lg-12">
                    <div className="ibox">
                        <div className="ibox-content">
                            <BaseDataTable
                                dataService={new DataService("/coupons")}
                                columns={columns}
                                actionButtons={CouponsActionButtons}
                                createButton={CreateButton}
                                formContentComponent={CouponFormContent}
                                showFullScreenButton={false}
                                labellizer={coupon => `${coupon.label} (-${coupon.percent_off}%)`}
                                oneResourceTypeName="un taux de remise"
                                thisResourceTypeName="ce taux de remise"
                                defaultSorted={[{id: "label", asc: true}]}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    );

}