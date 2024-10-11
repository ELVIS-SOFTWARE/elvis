import React from "react";

const moment = require("moment");
require("moment/locale/fr");

class DateFilter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            date: {
                d: null,
                m: null,
                y: null,
            },
        };
    }

    handleDateChange(event) {
        const newDate = Object.assign({}, this.state.date);
        newDate[event.target.name] = parseInt(event.target.value);
        if (event.target.value === "") {
            if (event.target.name === "y") {
                newDate.m = null;
                newDate.d = null;
            } else if (event.target.name === "m") newDate.d = null;
        }

        if (!newDate.y && !newDate.m && !newDate.d) this.props.onChange("");
        else this.props.onChange(newDate);

        this.setState({
            date: newDate,
        });
    }

    render() {
        const minYear = moment(this.props.minYear).year();
        const maxYear = moment(this.props.maxYear).year();

        return (
            <div>
                {
                    <RangedSelect
                        min={minYear}
                        max={maxYear + 3}
                        name="y"
                        value={this.state.date.y}
                        onChange={this.handleDateChange.bind(this)}
                        placeholder="Année"
                    />
                }
                {
                    <RangedSelect
                        min={1}
                        max={13}
                        name="m"
                        value={this.state.date.m}
                        onChange={this.handleDateChange.bind(this)}
                        placeholder="Mois"
                        enabled={this.state.date.y || false}
                    />
                }
                {
                    <RangedSelect
                        min={1}
                        max={32}
                        name="d"
                        value={this.state.date.d}
                        onChange={this.handleDateChange.bind(this)}
                        placeholder="Jour"
                        enabled={
                            (this.state.date.y || false) &&
                            (this.state.date.m || false)
                        }
                    />
                }
            </div>
        );
    }
}

/**
 * Returns a ranged
 *
 * @param {any} props
 *      min : minimum of ranged select
 *      max : maximum of ranged select
 *      name : name of the field
 *      value : value of the field
 *      placeholder : placeholder value text
 *      enabled : whether the field is enabled or not
 *      onChange : handler of change event on field
 */
export function RangedSelect(props) {
    if (typeof props.min !== "number" || typeof props.max !== "number")
        throw new Error("the arguments need to be integers");

    return (
        <select
            name={props.name}
            style={props.style}
            className={props.className}
            value={props.value || ""}
            disabled={props.enabled === false}
            onChange={props.onChange}
        >
            <option key="default" disabled={props.defaultDisabled} value="">
                {props.placeholder}
            </option>
            {_.range(props.min, props.max).map(i => (
                <option key={i} value={i}>
                    {props.cell && typeof props.cell === "function"
                        ? props.cell(i)
                        : i}
                </option>
            ))}
        </select>
    );
}

export default DateFilter;
