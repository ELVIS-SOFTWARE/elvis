import React from "react";
import { WEEKDAYS } from "../../tools/constants";
import { toHourMin, toDate, toLocaleDate } from "../../tools/format";

class ItemPreferences extends React.PureComponent {
    constructor(props) {
        super(props);
    }

    render() {
        const { items, onUp, onDown, sortable, showDate, showChoiceNumber = true } = this.props;

        const mappedItems = items.map((item, i) => {
            const start = toDate(item.start);
            const end = toDate(item.end);
            const location = _.get(item, "activity.location.label");

            return (
                <div
                    key={i}
                    className="space-between flex-center-aligned bg-muted p-sm m-sm"
                >
                    <div className="row flex-fill timeslot-weekday">
                        <div className="col-xs-12 col-sm-8">
                            {showChoiceNumber && <span className="label label-primary m-r-sm">
                                {`Choix ${i + 1}`}
                            </span>}
                            <span className="font-bold">
                                {WEEKDAYS[start.getDay()]}
                                {showDate ? ` ${toLocaleDate(start)}` : null}
                            </span>
                        </div>
                        <div className="col-xs-12 col-sm-4">
                            <div className="timeslot-hours">
                                <span>{toHourMin(start)}</span>{" "}
                                <i className="fas fa-angle-right" />{" "}
                                <span>{toHourMin(end)}</span>
                                {item.teacher && <span className="badge badge-primary m-l-sm">
                                    {item.teacher.first_name} {item.teacher.last_name}
                                </span>}
                                {location && <span className="badge badge-secondary m-l-sm">
                                    {location}
                                </span>}
                            </div>
                        </div>
                    </div>

                    {sortable ? (
                        <div className="flex sort-buttons">
                            {i > 0 ? (
                                <button
                                    className="btn btn-xs btn-primary m-r-xs"
                                    onClick={() => onUp(i)}
                                >
                                    <i className="fas fa-angle-up no-margins" />
                                </button>
                            ) : null}

                            {i < items.length - 1 ? (
                                <button
                                    className="btn btn-xs btn-primary"
                                    onClick={() => onDown(i)}
                                >
                                    <i className="fas fa-angle-down no-margins" />
                                </button>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            );
        });

        return (
            <div>
                <div>{mappedItems}</div>
            </div>
        );
    }
}

export default ItemPreferences;
