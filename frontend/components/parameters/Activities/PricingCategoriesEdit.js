import React, {Fragment} from "react";
import BaseDataTable from "../../common/baseDataTable/BaseDataTable";
import DataService from "../../common/baseDataTable/DataService";
import DefaultCreateButton from "../../common/baseDataTable/DefaultCreateButton";
import DefaultActionButtons from "../../common/baseDataTable/DefaultActionButtons";
import PricingCategoryFormContent from "./PricingCategoryFormContent";

function CreateButton({onCreate}) {
    return (
        <DefaultCreateButton
            label={"Créer une catégorie de prix"}
            onCreate={onCreate}
        />
    );
}

export default function PricingCategoriesEdit()
{
    const columns = [
        {
            id: "name",
            Header: "Nom de la catégorie de prix",
            accessor: "name",
        },
        {
            id: "number_lesson",
            Header: "Nombre de leçons",
            accessor: "number_lessons",
        },
        {
            id: "is_pack",
            Header: "Est un pack ?",
            accessor: "is_a_pack",
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
                                dataService={new DataService("/pricing_categories")}
                                columns={columns}
                                actionButtons={DefaultActionButtons}
                                createButton={CreateButton}
                                formContentComponent={PricingCategoryFormContent}
                                showFullScreenButton={false}
                                oneResourceTypeName="une catégorie de prix"
                                thisResourceTypeName="cette catégorie de prix"
                                defaultSorted={[{id: "name", asc: true}]}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    )
}