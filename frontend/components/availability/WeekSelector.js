import React, { Fragment } from "react";
import * as api from "../../tools/api";
import ErrorList from "../common/ErrorList";
import { toDate, toMonthName, toDateStr } from "../../tools/format";

const locale = "fr-FR";
const localeOptions = {
    day: "numeric",
    month: "numeric",
    year: "numeric",
};

const formatWeekBounds = week => {
    const from = toDate(week.from).toLocaleString(locale, localeOptions);
    const to = toDate(week.to).toLocaleString(locale, localeOptions);

    return `Du ${from} au ${to}`;
};

const renderWeeks = weeks =>
    weeks.map((week, i) => {
        return (
            <option key={i} value={week.from}>
                {formatWeekBounds(week)}
            </option>
        );
    });

const renderMonths = (months, year) =>
    Object.keys(months).map(month => {
        if (months[month].length === 0) {
            return null;
        }

        return (
            <optgroup key={month} label={`${toMonthName(month)} ${year}`}>
                {renderWeeks(months[month])}
            </optgroup>
        );
    });

const renderYears = data =>
    Object.keys(data).map(year => {
        return <Fragment key={year}>{renderMonths(data[year], year)}</Fragment>;
    });

const getFirstWeek = data => {
    const year = Object.keys(data)[0];
    const month = Object.keys(data[year])[0];

    return data[year][month][0].from;
};

class WeekSelector extends React.PureComponent {
    constructor(props) {
        super(props);

        const today = new Date();

        this.state = {
            errors: [],
            list: [],
            isFetching: false,
            selected: this.props.day || today.toISOString(),
        };

        this.handleSelect = this.handleSelect.bind(this);
    }

    componentDidMount() {
        api.get(`/season/evaluation/weeks`).then(({ data, error }) => {
            if (error) {
                this.setState({ errors: error, isFetching: false });
            } else {
                this.setState({
                    list: data,
                    isFetching: false,
                    selected: this.props.day || getFirstWeek(data)
                });
            }
        });
    }

    handleSelect(e) {
        this.setState({ selected: e.target.value });
    }

    render() {
        const { buttonLabel, alignRight } = this.props;
        const { list, errors, selected } = this.state;

        return (
            <Fragment>
                <ErrorList errors={errors} />

                <select
                    className="form-control m-b-sm"
                    value={selected}
                    onChange={this.handleSelect}
                >
                    {renderYears(list)}
                </select>

                <div className="clearfix">
                    <a
                        href={`/plannings/availabilities/${
                            this.props.planningId
                        }/${toDateStr(toDate(selected))}`}
                        className={`btn btn-primary ${
                            alignRight ? "pull-right" : ""
                        }`}
                    >
                        {buttonLabel}
                    </a>
                </div>
            </Fragment>
        );
    }
}

export default WeekSelector;
