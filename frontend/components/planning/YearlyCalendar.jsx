import React from "react";
import { Calendar as ReactYearlyCalendar } from "react-yearly-calendar";
import _, {isArray} from "lodash";
import { ISO_DATE_FORMAT } from "../utils";

const moment = require("moment");
require("moment/locale/fr");

export default class YearlyCalendar extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
          ...this.props,
        };
    }

    render()
    {
        const legend = this.props.legend

        // appel d'une fonction à chaque rendu et on force le rendu après chaques clic pour contourner un bug de réact
        // qui ne reload pas les données tous seul. Raison inconnue, probablement dû aux éléments parents.
        // la condition de type est là pour garder l'élément fonctionnel avec les autres composants parents.
        const activityInstances = typeof this.props.activityInstances === 'function' ? this.props.activityInstances() : this.props.activityInstances;

        let seasonDays = [];
        let seasonStart = moment(this.props.season && this.props.season.start).clone();

        while (seasonStart.isSameOrBefore(moment(this.props.season && this.props.season.end))) {
            seasonDays.push(moment(seasonStart));
            seasonStart.add(1, "days");
        }
        const customCssClasses = {
            holiday: _.map(this.props.season && this.props.season.holidays, h => h.date),
            seasonDay: _.map(seasonDays, date => date.format(ISO_DATE_FORMAT)),
            activityInstance: _(activityInstances)
                .filter(instance => instance.selected)
                .map(instance =>
                    instance.start.format(ISO_DATE_FORMAT),
                )
                .value(),
            existingInstances: _.map(this.state.existingDates, ai => moment(ai.time_interval.start).format(ISO_DATE_FORMAT)),
            today: [moment().format(ISO_DATE_FORMAT)],
        };

        return (
            <div>
                <h2>{this.props.label}</h2>
                <h3>{_.size((isArray(activityInstances) ? activityInstances : Object.values(activityInstances)).filter(ai => ai.selected))} cours prévus sur la saison</h3>
                <ReactYearlyCalendar
                    start={moment(this.props.season && this.props.season.start)}
                    end={moment(this.props.season && this.props.season.end)}
                    selectedDay={undefined}
                    customClasses={customCssClasses}
                    onPickDate={(date, classes) =>
                    {
                        this.props.handlePickDate(date, classes);
                        this.forceUpdate();
                    }}
                />

                <div className="flex m-t">
                    <div className="flex m-r-sm">
                        <b className="m-r-xs">{legend ? legend.selected : "Cours"}</b>
                        <div className="calendar-key-color" style={{backgroundColor: "#d63031"}}>
                        </div>
                    </div>
                    <div className="flex m-r-sm">
                        <b className="m-r-xs">{legend? legend.unselected : "Existant"}</b>
                        <div className="calendar-key-color" style={{backgroundColor: "#d630318F"}}>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
