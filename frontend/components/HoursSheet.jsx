import React from "react";
import moment from "moment";
import _ from "lodash";

moment.updateLocale("fr", {
    dow: 1,
    doy: 4,
});

import { getHoursString } from "./utils/DateUtils";
import { RangedSelect } from "./utils/DateFilter";
import { ISO_DATE_FORMAT, csrfToken } from "./utils";

const shiftDateLocalizer = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
});

export default class HoursSheet extends React.Component {
    constructor(props) {
        super(props);

        const now = new Date();

        const year = now.getFullYear();
        const month = now.getMonth();

        const sheets = {
            [year]: {
                [month]: {},
            },
        };

        this.fetchSheet(this.props.user.id, year, month);

        this.state = {
            year,
            month,
            sheets,
        };
    }

    /**
     * Request the server for a hours sheet.
     *
     * @param {*} userId the user's id.
     * @param {*} year the sheet's year.
     * @param {*} month the sheet's month.
     */
    fetchSheet(userId, year, month) {
        const url = `/users/${userId}/hours_sheet/${year}-${month + 1}`;

        fetch(url, {
            headers: {
                "X-CSRF-Token": csrfToken,
            },
        })
            .then(res => res.json())
            .then(val => {
                const newSheets = {
                    ...this.state.sheets,
                    [year]: {
                        ...this.state.sheets[year],
                        [month]: val,
                    },
                };

                this.setState({ sheets: newSheets });
            });
    }

    /**
     * Modify the state data structure to specify
     * on which of which year we're on.
     * If the hours sheet for these specified
     * parameters isn't already known, we
     * request the server for it.
     *
     * @param {number} year the year of the hours sheet.
     * @param {number} month the month of the hours sheet.
     */
    setStateDate(year, month) {
        this.setState(
            {
                year,
                month,
            },
            () => {
                this.fetchSheet(
                    this.props.user.id,
                    this.state.year,
                    this.state.month
                );
            }
        );
    }

    /**
     * Months browsing buttons handler.
     *
     * @param {number} diff the number of months to add/take from the actual year-month combo
     */
    changeMonth(diff) {
        let newMonth = this.state.month + diff;
        let newYear = this.state.year;

        if (
            (newMonth !== -1 || this.state.year !== this.props.minYear) &&
            (newMonth !== 12 || this.state.year !== this.props.maxYear)
        ) {
            if (newMonth === -1) {
                newYear--;
                newMonth = 11;
            } else if (newMonth === 12) {
                newYear++;
                newMonth = 0;
            }

            this.setStateDate(newYear, newMonth);
        }
    }

    /**
     * Period selectors' handler function.
     *
     * @param {*} e event object.
     */
    handleDateChange(e) {
        const val = parseInt(e.target.value);

        switch (e.target.name) {
            case "y":
                this.setStateDate(val, this.state.month);
                break;
            case "m":
                this.setStateDate(this.state.year, val - 1);
                break;
        }
    }

    render() {
        const sheet = _.get(this.state.sheets, `[${this.state.year}][${this.state.month}]`);

        // all activities kinds
        const activityKinds = _(sheet)
            .map(e => Object.keys(e.detail))
            .flatten()
            .uniq()
            .value();

        let shiftsCoveredByWeek = {};
        let coveringShiftsByWeek = {};

        //Groups the days of the hours sheet by week
        const shiftsByWeek = _.chain(sheet)
            .reduce((acc, v, k) => {
                const weekNum = moment(k).week();

                if (!acc[weekNum]) {
                    acc[weekNum] = [];
                    shiftsCoveredByWeek[weekNum] = { total: 0, counted: 0 };
                    coveringShiftsByWeek[weekNum] = 0.0;
                }

                acc[weekNum].push({
                    ...v,
                    d: moment(k),
                });

                shiftsCoveredByWeek[weekNum].total += v.covered.total;
                shiftsCoveredByWeek[weekNum].counted += v.covered.counted;
                coveringShiftsByWeek[weekNum] += v.covering;

                return acc;
            }, {})
            .map(w => _.orderBy(w, ({d}) => d.valueOf()))
            .value();

        shiftsCoveredByWeek = Object.values(shiftsCoveredByWeek);
        coveringShiftsByWeek = Object.values(coveringShiftsByWeek);

        //variables aggregating global totals and kinds totals
        let monthTotal = 0;
        const detailTotals = activityKinds.reduce((acc, k) => {
            return { ...acc, [k]: 0 };
        }, {});

        return (
            <div>
                <div className="row wrapper border-bottom white-bg page-heading m-b-md">
                    <h2>
                        Feuille d'heures de{" "}
                        <a href={`/users/${this.props.user.id}`}>
                            {this.props.user.first_name}{" "}
                            {this.props.user.last_name}
                        </a>
                    </h2>
                </div>

                <div className="buttons-header">
                    <div className="date-component" />
                    <button
                        className="btn btn-primary m-r-sm"
                        onClick={e => this.changeMonth(-1)}
                    >
                        <i className="fas fa-arrow-left" />
                    </button>
                    <button
                        className="btn btn-primary m-r-sm"
                        onClick={e => this.changeMonth(1)}
                    >
                        <i className="fas fa-arrow-right" />
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={e => this.changeMonth(0)}
                    >
                        <i className="fas fa-sync" />
                    </button>

                    <span className="separator">|</span>

                    {
                        //Year and month selectors
                    }
                    <RangedSelect
                        min={1}
                        max={13}
                        name="m"
                        value={this.state.month + 1}
                        onChange={this.handleDateChange.bind(this)}
                        className="form-control form-control-medium m-r-sm"
                        cell={v =>
                            capitalize(moment([2000, v - 1, 1]).format("MMMM"))
                        }
                        defaultDisabled={true}
                    />
                    <RangedSelect
                        min={this.props.minYear || 1975}
                        max={this.props.maxYear + 1 || 2101}
                        name="y"
                        value={this.state.year}
                        className="form-control form-control-small"
                        onChange={this.handleDateChange.bind(this)}
                        defaultDisabled={true}
                    />
                </div>

                <div className="row">
                    <div className="col-xs-12 col-md-10 col-lg-8">
                        <div className="ibox">
                            <div className="ibox-title">
                                <h3>
                                    Feuille d'heures{" "}
                                    {moment(this.state.month + 1, "MM").format(
                                        "MMMM"
                                    )}{" "}
                                    {this.state.year}
                                </h3>
                            </div>
                            <div className="ibox-content">
                                <table className="table table-bordered">
                                    <thead>
                                        <tr>
                                            <th>SEMAINE</th>
                                            {//Put activity kinds in the headers
                                                activityKinds.map((e, i) => (
                                                    <th key={i}>
                                                        {e.toUpperCase()}
                                                    </th>
                                                ))}
                                            <th>TOTAL</th>
                                            <th>REMPLAÇANT<sup>*</sup></th>
                                            <th>REMPLACÉ<sup>*</sup></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/*
                                         *  Renders each week, displaying their totals grouped by activity kind and global.
                                         */
                                            _.map(shiftsByWeek, (w, k) => (
                                                <tr key={k}>
                                                    {
                                                        //Week number and start day
                                                    }
                                                    <td
                                                        style={{
                                                            fontWeight: "bold",
                                                        }}
                                                    >
                                                        <a
                                                            href={`/planning/${
                                                                this.props
                                                                    .planningId
                                                                }/${moment(w[0].d)
                                                                    .weekday(0)
                                                                    .format(
                                                                        ISO_DATE_FORMAT
                                                                    )}`}
                                                        >
                                                            {w.length > 1 &&
                                                                w[0].d.date() !==
                                                                w[
                                                                    w.length - 1
                                                                ].d.date()
                                                                ? `${w[0].d
                                                                    .format(
                                                                        "D MMMM"
                                                                    )
                                                                    .toUpperCase()} - ${w[
                                                                        w.length - 1
                                                                    ].d
                                                                        .format(
                                                                            "D MMMM"
                                                                        )
                                                                        .toUpperCase()}`
                                                                : `${w[0].d
                                                                    .format(
                                                                        "D MMMM"
                                                                    )
                                                                    .toUpperCase()}`}
                                                        </a>
                                                    </td>
                                                    {//total of hours of the week per kind
                                                        activityKinds.map((kind, i) => {
                                                            let kindTotal = 0;
                                                            let kindCovering = 0;
                                                            let kindCovered = 0;

                                                            w
                                                                .map(d => d.detail)
                                                                .forEach(
                                                                    (d) => {
                                                                        kindTotal += _.get(d[kind], "total") || 0;
                                                                        kindCovering += _.get(d[kind], "covering") || 0;
                                                                        kindCovered += _.get(d[kind], "covered") || 0;
                                                                    },
                                                                        
                                                                    0
                                                                );

                                                            //increase kind total aggregator
                                                            detailTotals[
                                                                kind
                                                            ] += kindTotal;

                                                            let display = `${getHoursString(kindTotal)}`;

                                                            if(kindCovering || kindCovered) {
                                                                display += " (";
                                                                const parts = [];

                                                                if(kindCovering)
                                                                    parts.push(`${getHoursString(kindCovering)} remplaçant`);
                                                                if(kindCovered)
                                                                    parts.push(`${getHoursString(kindCovered)} remplacé`);

                                                                display += parts.join(", ");
                                                                display += ")"
                                                            }

                                                            return (
                                                                <td key={i}>
                                                                    {display}
                                                                </td>
                                                            );
                                                        })}
                                                    {
                                                        //Week's total work hours, regardless of activity kinds
                                                    }
                                                    <td
                                                        style={{
                                                            fontWeight: "bold",
                                                        }}
                                                    >
                                                        {(() => {
                                                            const total = w.reduce(
                                                                (acc, d) =>
                                                                    acc + d.total,
                                                                0
                                                            );
                                                            monthTotal += total;
                                                            return getHoursString(
                                                                total
                                                            );
                                                        })()}
                                                    </td>
                                                    {/*Heures faites en tant que remplaçant*/}
                                                    <td>
                                                        {getHoursString(
                                                            coveringShiftsByWeek[k]
                                                        )}
                                                    </td>
                                                    {/*Heures remplacées*/}
                                                    <td>
                                                        {getHoursString(
                                                            shiftsCoveredByWeek[k].total
                                                        )} {shiftsCoveredByWeek[k].total ? `(${getHoursString(shiftsCoveredByWeek[k].counted)} comptées)` : null}
                                                    </td>
                                                </tr>
                                            ))}
                                        {
                                            //Month's summary
                                        }
                                        <tr
                                            style={{
                                                color: "white",
                                                background: "rgb(214, 48, 49)",
                                                fontWeight: "bold",
                                            }}
                                        >
                                            <td>TOTAUX</td>
                                            {activityKinds.map((e, i) => (
                                                <td key={i}>
                                                    {getHoursString(
                                                        detailTotals[e]
                                                    )}
                                                </td>
                                            ))}
                                            <td>
                                                {getHoursString(monthTotal)}
                                            </td>
                                            <td>
                                                {getHoursString(
                                                    _.sum(coveringShiftsByWeek)
                                                )}
                                            </td>
                                            <td>
                                                {getHoursString(
                                                    _.sum(shiftsCoveredByWeek.map(s => s.total))
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="ibox-footer">
                                <p>
                                    *Ces heures sont comprises dans le compte
                                    des activités
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

function capitalize(s) {
    return s[0].toUpperCase() + s.substring(1);
}
