import React, { useMemo } from 'react';
import _ from "lodash";

function displayDuration(duration) {
    if (duration) {
        if (duration >= 60) {
            const hours = Math.floor(duration / 60);
            const minutes = duration % 60;
            return `${hours}h${minutes.toString().padStart(2, '0')}`;
        } else {
            return `${duration.toString().padStart(2, '0')}min`;
        }

    } else {
        return "/";
    }
}
function groupByDisplayName(items) {
    return items.reduce((groups, item) => {
        const key = item.display_name;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
}

function createDisplayItems(groupedItems) {
    return Object.values(groupedItems).map(group => {
        return {
            display_name: group[0].display_name,
            duration: group[0].duration,
            display_price: group.reduce((total, item) => total + item.display_price, 0),
            amount: group.length
        };
    });
}

function getSelectedPacks({packs, selectedPacks}) {
    return _.flatMap(selectedPacks, (pack, activityRef) => {
        const packToDisplay = packs[activityRef]
            ? packs[activityRef].filter(p => pack.includes(p.pricing_category_id))
            : null;
        return packToDisplay
            ? packToDisplay.map(activityRefPricing => ({
                display_name: `${activityRefPricing.activity_ref.label} - ${activityRefPricing.pricing_category.name}`,
                duration: activityRefPricing.activity_ref.duration,
                display_price: activityRefPricing.price,
            }))
            : [];
    });
}
export default function SelectedActivitiesTable(props) {
    // regroup activities by display name
    const groupedActivities = useMemo(() => groupByDisplayName(props.selectedActivities), [props.selectedActivities]);
    const groupedPacks = useMemo(() => groupByDisplayName(getSelectedPacks({packs: props.packs, selectedPacks: props.selectedPacks})), [props.packs, props.selectedPacks]);
    // create display items
    const displayActivities = useMemo(() => createDisplayItems(groupedActivities), [groupedActivities]);
    const displayPacks = useMemo(() => createDisplayItems(groupedPacks), [groupedPacks]);
    // merge activities and packs
    const displayActivitiesAndPacks = useMemo(() => [...displayActivities, ...displayPacks], [displayActivities, displayPacks]);

    return (
        <table className="table">
            <thead>
            <tr style={{backgroundColor: "#F7FBFC", color: "#8AA4B1"}}>
                <th scope="col">Activité</th>
                <th scope="col">Durée</th>
                <th scope="col">Tarif estimé</th>
            </tr>
            </thead>
            <tbody>
            {displayActivitiesAndPacks.map((activity, index) => (
                <tr key={index} style={{color: "#00283B"}}>
                    <td className="font-weight-bold">{activity.display_name}
                        {activity.amount > 1 ? ` x${activity.amount}` : ""}</td>
                    <td>{displayDuration(activity.duration)}</td>
                    <td>{activity.display_price}€</td>
                </tr>
            ))}
            </tbody>
            <tfoot>
            <tr style={{backgroundColor: "#F7FBFC", color: "#8AA4B1"}}>
                <td></td>
                <td className="text-right font-weight-bold">Total estimé</td>
                <td className="font-weight-bold">{displayActivitiesAndPacks.reduce((total, activity) => total + activity.display_price, 0)}€</td>
            </tr>
            </tfoot>
        </table>
    );
}