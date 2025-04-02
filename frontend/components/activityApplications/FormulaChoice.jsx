import React, { Fragment, useState } from "react";
import _ from "lodash";
import WysiwygViewer from "../utils/WysiwygViewer";
import { toast } from "react-toastify";
import FormulaActivitiesModal from "./FormulaActivitiesModal";

const moment = require("moment-timezone");
require("moment/locale/fr");

const FormulaChoice = ({
                           infoText,
                           formulas = [],
                           selectedFormulas = [],
                           selectedFormulaActivities = {},
                           handleAddFormula,
                           handleRemoveFormula,
                           handleUpdateFormulaActivities,
                           allActivityRefs,
                       }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [priceOrder, setPriceOrder] = useState(null);
    const [activeFormula, setActiveFormula] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNewFormula, setIsNewFormula] = useState(false);

    const handlePriceOrderClick = () => {
        if (priceOrder === "asc") setPriceOrder("desc");
        else if (priceOrder === "desc") setPriceOrder(null);
        else setPriceOrder("asc");
    };

    let filteredFormulas = formulas;
    if (searchTerm) {
        filteredFormulas = formulas.filter((f) => {
            const nameMatch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
            const activitiesMatch = (f.formule_items || []).some((item) =>
                item.item.display_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            return nameMatch || activitiesMatch;
        });
    }
    if (priceOrder) {
        filteredFormulas = filteredFormulas.sort((a, b) => {
            const priceA = parseFloat(a.display_price) || 0;
            const priceB = parseFloat(b.display_price) || 0;
            return priceOrder === "asc" ? priceA - priceB : priceB - priceA;
        });
    }

    const isFormulaSelected = (formulaId) => selectedFormulas.includes(formulaId);

    const generateFormulaRow = (formula) => {
        const isSelected = isFormulaSelected(formula.id);
        const iconClass = isSelected ? "fas fa-check" : "fas fa-plus";
        const buttonStyle = {
            borderRadius: "50%",
            color: "white",
            backgroundColor: isSelected ? "#86D69E" : "#0079BF",
            border: 0,
            width: "32px",
            height: "32px",
        };

        const handleAction = () => {
            if (!isSelected) {
                setActiveFormula(formula);
                setIsModalOpen(true);
                setIsNewFormula(true);
            } else {
                setActiveFormula(formula);
                setIsModalOpen(true);
                setIsNewFormula(false);
            }
        };

        return (
            <tr key={formula.id} style={{ color: "rgb(0, 51, 74)" }}>
                <td style={{ fontWeight: "bold" }}>{formula.name}</td>
                <td className="text-center">
                    {(formula.formule_items || [])
                        .map((item) => item.item.display_name)
                        .join(", ") || "--"}
                </td>
                <td className="text-center">
                    {formula.formule_pricings && formula.formule_pricings[0]
                        ? `${formula.formule_pricings[0].price} €`
                        : "--"}
                </td>
                <td className="text-center">
                    <button onClick={handleAction} style={buttonStyle}>
                        <i className={iconClass}></i>
                    </button>
                </td>
            </tr>
        );
    };

    const availableRows = filteredFormulas.map((f) => generateFormulaRow(f));

    const selectedRows = selectedFormulas.map((formulaId) => {
        const formula = formulas.find((f) => f.id === formulaId);
        const chosenActivities = selectedFormulaActivities[formula.id] || [];
        return (
            <Fragment key={formula.id}>
                <tr style={{ backgroundColor: "#f5f5f5" }}>
                    <td style={{ fontWeight: "bold" }} colSpan="2">
                        {formula.name}
                    </td>
                    <td className="text-center">
                        {formula.formule_pricings && formula.formule_pricings[0]
                            ? `${formula.formule_pricings[0].price} €`
                            : "--"}
                    </td>
                    <td className="text-center">
                        <button
                            onClick={() => handleRemoveFormula(formula.id)}
                            style={{
                                borderRadius: "50%",
                                color: "white",
                                backgroundColor: "#00334A",
                                border: 0,
                                width: "32px",
                                height: "32px",
                            }}
                        >
                            <i className="fas fa-minus"></i>
                        </button>
                    </td>
                </tr>
                {chosenActivities.length > 0 ? (
                    chosenActivities.map((activityId) => {
                        const activityItem = formula.formule_items.find(
                            (item) => item.item.id === activityId
                        );
                        if (!activityItem) return null;

                        const fullActivity = allActivityRefs.find(
                            (activity) => activity.id === activityItem.item.id
                        );

                        const duration = fullActivity?.duration || "--";

                        return (
                            <tr key={`${formula.id}-${activityItem.item.id}`} style={{ backgroundColor: "#ffffff" }}>
                                <td style={{ paddingLeft: "30px" }}>{activityItem.item.display_name}</td>
                                <td className="text-center">{duration} {duration !== "--" ? "min" : ""}</td>
                                <td></td>
                                <td></td>
                            </tr>
                        );
                    })
                ) : (
                    <tr>
                        <td colSpan="4" className="text-center">
                            Aucune activité sélectionnée
                        </td>
                    </tr>
                )}
            </Fragment>
        );
    });


    const handleCloseModal = () => {
        setIsModalOpen(false);
    };


    const handleSaveModalActivities = (selectedActivities) => {
        if (isNewFormula) {
            handleAddFormula(activeFormula.id);
        }

        handleUpdateFormulaActivities(activeFormula.id, [...selectedActivities]);
        setIsModalOpen(false);
    };

    const calculateTotalPrice = () => {
        return selectedFormulas.reduce((total, formulaId) => {
            const formula = formulas.find(f => f.id === formulaId);
            if (formula?.formule_pricings?.[0]?.price) {
                return total + parseFloat(formula.formule_pricings[0].price);
            }
            return total;
        }, 0);
    };

    return (
        <Fragment>
            <div>
                {infoText && (
                    <div
                        className="alert alert-info col-md-8 d-inline-flex align-items-center p-1"
                        style={{
                            border: "1px solid #0079BF",
                            borderRadius: "5px",
                            color: "#0079BF",
                        }}
                    >
                        <div className="col-sm-1 p-0 text-center">
                            <i className="fas fa-info-circle"></i>
                        </div>
                        <div className="col-sm p-0">
                            <WysiwygViewer wysiwygStrData={infoText} />
                        </div>
                    </div>
                )}
            </div>

            <div className="row">
                <div className="col-xs-12 col-lg-6">
                    <h3 className="mb-4" style={{ color: "#8AA4B1" }}>
                        Choix de la formule
                    </h3>
                    <div className="d-inline-flex justify-content-between mt-1 mb-2 w-100">
                        <div>
                            <button
                                className="btn btn-xs"
                                style={{
                                    borderRadius: "40px",
                                    border: "1px solid #00334A",
                                    color: "#00334A",
                                    padding: "4px 10px",
                                }}
                                onClick={handlePriceOrderClick}
                            >
                                Prix{" "}
                                <i
                                    className={`fas fa-caret-${
                                        priceOrder === "asc" ? "up" : "down"
                                    }`}
                                ></i>
                            </button>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                borderRadius: "40px",
                                border: "0",
                                color: "#8AA4B1",
                                padding: "4px 10px",
                                backgroundColor: "white",
                            }}
                        >
                            <input
                                type="text"
                                placeholder="Rechercher"
                                style={{
                                    border: "none",
                                    backgroundColor: "transparent",
                                }}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <i className="fas fa-search"></i>
                        </div>
                    </div>
                    <table
                        className="table table-striped"
                        style={{ borderRadius: "12px", overflow: "hidden" }}
                    >
                        <thead>
                        <tr
                            style={{
                                backgroundColor: "#00334A",
                                color: "white",
                            }}
                        >
                            <th>Formule</th>
                            <th>Activités incluses</th>
                            <th>Tarif estimé</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {availableRows.length > 0 ? (
                            availableRows
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center">
                                    Aucune formule disponible
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="col-xs-12 col-lg-6">
                    <h3 style={{ color: "#8AA4B1" }}>Récapitulatif</h3>
                    <table
                        className="table table-striped"
                        style={{ borderRadius: "12px", overflow: "hidden" }}
                    >
                        <thead>
                        <tr
                            style={{
                                backgroundColor: "#00334A",
                                color: "white",
                            }}
                        >
                            <th>Formule</th>
                            <th>Durée</th>
                            <th>Tarif estimé</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {selectedRows.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center">
                                    Aucune formule sélectionnée
                                </td>
                            </tr>
                        ) : (
                            selectedRows
                        )}
                        </tbody>
                    </table>
                    {selectedFormulas.length > 0 && (
                        <div className="d-flex justify-content-end mt-2">
                            <div
                                className="p-2 bg-light"
                                style={{
                                    borderRadius: "5px",
                                    fontWeight: "bold",
                                }}
                            >
                                Total estimé: {calculateTotalPrice().toFixed(2)}{" "}
                                €
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <FormulaActivitiesModal
                activeFormula={activeFormula}
                isOpen={isModalOpen}
                isNewFormula={isNewFormula}
                allActivityRefs={allActivityRefs}
                initialSelectedActivities={activeFormula ? selectedFormulaActivities[activeFormula.id] || [] : []}
                onCancel={handleCloseModal}
                onSave={handleSaveModalActivities}
                onRemoveFormula={handleRemoveFormula}
            />
        </Fragment>
    );
};

export default FormulaChoice;