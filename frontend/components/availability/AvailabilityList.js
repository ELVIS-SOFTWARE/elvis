import React, { Fragment } from "react";
import { toDate, toHourMin, displayLevel } from "../../tools/format";
import { WEEKDAYS } from "../../tools/constants";
import KindLegend from "../common/KindLegend";

const GroupedAvailabilities = ({
    intervals,
    canComment,
    onComment,
    onDelete,
    showActions,
    disabled,
    allowedKinds,
}) => (
    <Fragment>
        {intervals.map((item, i) => (
            <div
                key={i}
                className={`bg-muted p-sm m-b-xs border-kind border-kind-${item.kind}`}
            >
                {toHourMin(toDate(item.start))}
                {" - "}
                {toHourMin(toDate(item.end))}
                {item.comment && (
                    <i
                        title="Commentaire saisi"
                        className="fas fa-comment m-l-sm"
                    />
                )}

                <div className="pull-right">
                    {canComment ? (
                        <button
                            className="btn btn-xs btn-primary m-l-xs"
                            title="Saisir ou éditer un commentaire"
                            disabled={disabled}
                            onClick={() => onComment(item.id)}
                        >
                            <i className="fas fa-comment no-margins" />
                        </button>
                    ) : null}
                    {showActions &&
                    !item.is_validated &&
                    allowedKinds.includes(item.kind) ? (
                        <button
                            className="btn btn-xs m-l-xs btn-primary"
                            disabled={disabled}
                            onClick={() => onDelete(item.id)}
                        >
                            <i className="fas fa-times no-margins" />
                        </button>
                    ) : null}
                </div>
            </div>
        ))}
    </Fragment>
);

class AvailabilityList extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            groupedItems: {},
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.list !== this.props.list) {
            // Group intervals by weekday
            const groupedItems = this.props.list.reduce((obj, item) => {
                const day = toDate(item.start).getDay();
                if (!obj[day]) {
                    obj[day] = [];
                }

                obj[day].push(item);

                return obj;
            }, {});

            // Sort intervals
            const weekdays = Object.keys(groupedItems).map(i => parseInt(i));
            weekdays.forEach(day => {
                groupedItems[day] = groupedItems[day].sort(
                    (a, b) => toDate(a.start) - toDate(b.start)
                );
            });

            this.setState({ groupedItems });
        }
    }

    handleDeleteAll(weekday) {
        const message = `Voulez-vous vraiment supprimer les créneaux du ${WEEKDAYS[weekday]} ?`;

        if (window.confirm(message)) {
            this.props.onDelete(
                this.state.groupedItems[weekday]
                    .filter(
                        interval =>
                            !interval.is_validated &&
                            this.props.allowedKinds.includes(interval.kind)
                    )
                    .map(interval => interval.id)
            );
        }
    }

    render() {
        // Props and state vars
        const {
            list,
            onDelete,
            canComment,
            onComment,
            disabled,
            showActions,
            kinds,
            allowedKinds,
        } = this.props;
        const { groupedItems } = this.state;

        return (
            <div className="ibox">
                <div className="ibox-title">
                    <h3>
                        {!showActions ? (
                            <i className="fas fa-lock m-r-sm" />
                        ) : null}
                        {"Mes disponibilités"}
                    </h3>
                </div>
                <div className="ibox-content">
                    <div className="m-b-sm">
                        <KindLegend kinds={kinds} />
                    </div>

                    {list.length === 0 ? <p>{"Aucune disponibilité"}</p> : null}

                    <div className="flex flex-wrap">
                        {Object.keys(groupedItems).map((weekday, i) => (
                            <Fragment key={weekday}>
                                <div className="weekday-availabilities">
                                    <div className="m-b-xs p-xs font-bold bg-primary">
                                        {WEEKDAYS[weekday]}

                                        {showActions && !(groupedItems[weekday].filter(d => !allowedKinds.includes(d.kind)).length > 0) ? (
                                            <div className="pull-right">
                                                <button
                                                    className="btn btn-xs btn-primary"
                                                    disabled={disabled}
                                                    onClick={() =>
                                                        this.handleDeleteAll(
                                                            weekday
                                                        )
                                                    }
                                                >
                                                    <i className="fas fa-times no-margins" />
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>

                                    <div>
                                        <GroupedAvailabilities
                                            intervals={groupedItems[weekday]}
                                            onDelete={onDelete}
                                            canComment={canComment}
                                            onComment={onComment}
                                            disabled={disabled}
                                            showActions={showActions}
                                            allowedKinds={allowedKinds}
                                        />
                                    </div>
                                </div>
                            </Fragment>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
}

export default AvailabilityList;
