import React, { useState, useEffect } from 'react';

const ModalCustom = ({ children, closeModal }) => {
    return (
        <div
            className="modal inmodal"
            style={{
                display: "block",
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0,0,0,0.5)",
                zIndex: 1000,
                overflow: "auto",
            }}
        >
            <div className="modal-dialog" style={{ margin: "50px auto", maxWidth: "600px" }}>
                <div
                    className="modal-content animated"
                    style={{ backgroundColor: "white", borderRadius: "5px", padding: "20px" }}
                >
                    <div
                        className="modal-header"
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                        <h2>Sélectionner les activités pour la formule</h2>
                        <button
                            onClick={closeModal}
                            className="close"
                            type="button"
                            style={{ fontSize: "1.5rem", background: "none", border: "none" }}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    <div className="modal-body">{children}</div>
                </div>
            </div>
        </div>
    );
};

const FormulaActivitiesModal = ({
                                    activeFormula,
                                    isOpen,
                                    isNewFormula,
                                    allActivityRefs,
                                    initialSelectedActivities = [],
                                    onCancel,
                                    onSave,
                                    onRemoveFormula
                                }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [tempSelectedActivities, setTempSelectedActivities] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [availableActivities, setAvailableActivities] = useState([]);

    useEffect(() => {
        setTempSelectedActivities(initialSelectedActivities);
    }, [initialSelectedActivities, activeFormula]);

    useEffect(() => {
        if (!activeFormula || !allActivityRefs) return;

        const processedActivities = [];

        const processFormulaItems = () => {
            if (!activeFormula.formule_items || !activeFormula.formule_items.length) return [];

            activeFormula.formule_items.forEach(item => {

                if (item.item_type === "ActivityRefKind") {
                    const familyActivities = allActivityRefs.filter(activity =>
                        activity.activity_ref_kind_id === item.item.id
                    );
                    familyActivities.forEach(activity => {
                        processedActivities.push({
                            ...activity,
                            fromFamily: true,
                            familyId: item.item.id,
                            familyName: item.item.display_name
                        });
                    });
                } else {

                    const activity = allActivityRefs.find(a => a.id === item.item.id);
                    if (activity) {
                        processedActivities.push({
                            ...activity,
                            fromFamily: false
                        });
                    }
                }
            });
            return processedActivities;
        };

        const activities = processFormulaItems();
        setAvailableActivities(activities);
    }, [activeFormula, allActivityRefs]);

    if (!isOpen || !activeFormula) return null;

    const toggleActivitySelection = (activityId) => {
        setErrorMessage("");
        setTempSelectedActivities((prev) => {
            if (prev.includes(activityId)) {
                return prev.filter(id => id !== activityId);
            } else {
                if (prev.length >= activeFormula.number_of_items) {
                    setErrorMessage(`Vous ne pouvez sélectionner que ${activeFormula.number_of_items} activité${activeFormula.number_of_items > 1 ? "s" : ""} pour cette formule.`);
                    return prev;
                }
                return [...prev, activityId];
            }
        });
    };

    const handleCancelActivities = () => {
        setErrorMessage("");

        if (!isNewFormula && tempSelectedActivities.length === 0) {
            onRemoveFormula(activeFormula.id);
        }

        onCancel();
    };

    const handleSaveActivities = () => {
        if (tempSelectedActivities.length < activeFormula.number_of_items) {
            setErrorMessage(`Veuillez sélectionner ${activeFormula.number_of_items} activité${activeFormula.number_of_items > 1 ? "s" : ""} pour valider cette formule.`);
            return;
        }

        setErrorMessage("");
        onSave(tempSelectedActivities);
    };

    const filteredActivities = availableActivities.filter(activity => {
        if (!searchTerm) return true;
        return activity.label.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const groupedActivities = filteredActivities.reduce((acc, activity) => {
        if (activity.fromFamily) {
            if (!acc[activity.familyId]) {
                acc[activity.familyId] = {
                    familyName: activity.familyName,
                    activities: []
                };
            }
            acc[activity.familyId].activities.push(activity);
        } else {
            if (!acc['individual']) {
                acc['individual'] = {
                    familyName: 'Activités individuelles',
                    activities: []
                };
            }
            acc['individual'].activities.push(activity);
        }
        return acc;
    }, {});

    return (
        <ModalCustom closeModal={handleCancelActivities}>
            <h4>Activités dans la formule "{activeFormula.name}"</h4>
            <p>
                Sélectionnez {activeFormula.number_of_items} activité{activeFormula.number_of_items > 1 ? 's' : ''} parmi les suivantes:
            </p>
            <div className="d-inline-flex justify-content-between mt-1 mb-2 w-100">
                <div></div>
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
                        placeholder="Rechercher une activité"
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
            <div>
                <h5 style={{ color: "#8AA4B1" }}>Choix des activités</h5>
                {Object.keys(groupedActivities).length > 0 ? (
                    Object.entries(groupedActivities).map(([familyId, family]) => (
                        <div key={familyId} className="mb-4">
                            <h6 style={{ color: "#00334A", fontWeight: "bold", borderBottom: "1px solid #eee", paddingBottom: "8px" }}>
                                {family.familyName}
                            </h6>
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
                                    <th>Activité</th>
                                    <th>Durée</th>
                                    <th></th>
                                </tr>
                                </thead>
                                <tbody>
                                {family.activities.map(activity => {
                                    const duration = activity.duration || "--";
                                    const isSelected = tempSelectedActivities.includes(activity.id);
                                    const iconClass = isSelected ? "fas fa-check" : "fas fa-plus";
                                    const buttonStyle = {
                                        borderRadius: "50%",
                                        color: "white",
                                        backgroundColor: isSelected ? "#86D69E" : "#0079BF",
                                        border: 0,
                                        width: "32px",
                                        height: "32px",
                                    };

                                    return (
                                        <tr
                                            key={activity.id}
                                            style={{ color: "rgb(0, 51, 74)" }}
                                        >
                                            <td style={{ fontWeight: "bold" }}>
                                                {activity.label}
                                            </td>
                                            <td>
                                                {duration}{" "}
                                                {duration !== "--" ? "min" : ""}
                                            </td>
                                            <td className="text-center">
                                                <button
                                                    onClick={() => toggleActivitySelection(activity.id)}
                                                    style={buttonStyle}
                                                >
                                                    <i className={iconClass}></i>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    ))
                ) : (
                    <div className="alert alert-info">
                        Aucune activité disponible dans cette formule
                    </div>
                )}
            </div>

            <div className="mt-3">
                <p>
                    <strong>Activités sélectionnées:</strong> {tempSelectedActivities.length} / {activeFormula.number_of_items}
                </p>
            </div>

            {errorMessage && (
                <div className="text-danger" style={{ marginTop: "10px", fontSize: "14px" }}>
                    <i className="fas fa-exclamation-circle" style={{ marginRight: "5px" }}></i>
                    {errorMessage}
                </div>
            )}
            <div style={{ textAlign: "right", marginTop: "15px" }}>
                <button className="btn btn-secondary" onClick={handleCancelActivities}>
                    Annuler
                </button>
                <button className="btn btn-primary" onClick={handleSaveActivities} style={{ marginLeft: "10px" }}>
                    Enregistrer
                </button>
            </div>
        </ModalCustom>
    );
};

export default FormulaActivitiesModal;