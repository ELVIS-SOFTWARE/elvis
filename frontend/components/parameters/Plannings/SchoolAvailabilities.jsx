import React, {Component, Fragment, useEffect, useRef, useState} from "react";
import AvailabilityManager from "../../availability/AvailabilityManager";
import PropTypes from "prop-types";
import * as api from "../../../tools/api";
import swal from "sweetalert2";

export default function SchoolAvailabilities({planningId, authToken, seasons}) {
    const [intervals, setIntervals] = useState([]);
    const [season, setSeason] = useState(seasons.find(s => s.is_current) || seasons[0] || {});
    const availabilityRef = useRef();

    const convertToFirstWeekOfSeason = (seasonStart) => {
        if (!seasonStart) return null;

        const startDate = new Date(seasonStart);
        const monday = new Date(startDate);
        const currentDay = monday.getDay();

        if (currentDay === 0) {
            monday.setDate(monday.getDate() + 1);
        } else if (currentDay > 1) {
            monday.setDate(monday.getDate() + (8 - currentDay));
        }

        const month = (monday.getMonth() + 1).toString().padStart(2, '0');
        const day = monday.getDate().toString().padStart(2, '0');
        return `${monday.getFullYear()}-${month}-${day}`;
    };

    const onAdd = (newIntervals) => {
        setIntervals(intervals.concat(newIntervals));
    }

    const onDelete = (intervals) => {
        setIntervals(intervals);
    }

    useEffect(() => {
        const firstMonday = convertToFirstWeekOfSeason(season.start);

        api.set()
            .success(data => {
                setIntervals(data.intervals);
                availabilityRef.current.componentDidMount();
            })
            .error(() => {
                swal({
                    title: "Erreur lors de la récupération des disponibilités",
                    type: "error",
                });
            })
            .get(`/planning/${planningId}/intervals/week/${firstMonday}`);
    }, [season]);

    return <Fragment>
        <h4>Gestion des horaires de votre école</h4>
        <p className="mb-5">(si il y en a, ceux-ci seront proposés par défaut aux élèves lors de leur inscription)</p>

        <div style={{margin: "-30px"}}>
            <AvailabilityManager
                ref={availabilityRef}
                locked={false}
                isTeacher={false}
                authToken={authToken}
                planningId={planningId}
                kinds={["p"]}
                day={season.start}
                seasonId={season.id}
                forSeason
                onAdd={onAdd}
                onDelete={onDelete}
                intervals={intervals}
            />
        </div>
    </Fragment>
}

SchoolAvailabilities.propTypes = {
    seasons: PropTypes.array,
    authToken: PropTypes.string,
    planningId: PropTypes.number
}