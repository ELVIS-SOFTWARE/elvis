import React from "react";
import InputSelect from "../common/InputSelect";
import * as api from "../../tools/api.js";
import { toast } from "react-toastify";
import { MESSAGES } from "../../tools/constants";
import AddCourseSummary from "./AddCourseSummary";
import moment from "moment-timezone";

export default class AddTeacherForCourse extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            teachers: undefined,
            teacherId: this.props.initialValues.teacherId,
            firstDayStartTime: this.props.initialValues.firstDayStartTime,
            firstDayEndTime: this.props.initialValues.firstDayEndTime,
            fromDate: this.props.initialValues.fromDate,
            toDate: this.props.initialValues.toDate,
            summary: this.props.summary,
        };
        this.handleChange = this.handleChange.bind(this);
    }


    componentDidMount() {
        api.get(`/teachers/index?activityId=${this.props.initialValues.activityRefId}`)
            .then(({ data, error }) => {
                if (error) {
                    console.log(error);
                } else {
                    this.setState({ ...this.state, teachers: data });
                }
                if (data.length > 0) {
                    if (this.state.summary.teacher) {
                        const teacher = { ...this.state.summary.teacher, id: this.state.teacherId };
                        this.setState({
                            ...this.state,
                            teacherId: teacher.id,
                            summary: {
                                ...this.state.summary,
                                teacher,
                            },
                        });
                        this.handleChange(teacher.id);
                    } else {
                        const teacher = data[0];
                        this.setState({
                            ...this.state,
                            teacherId: teacher.id,
                            summary: {
                                ...this.state.summary,
                                teacher: {
                                    id: teacher.id,
                                    last_name: teacher.last_name,
                                    first_name: teacher.first_name,
                                },
                            },
                        });
                        this.handleChange(teacher.id);
                    }
                }
            });
    }



    isValidated() {
        if (!this.state.teacherId) {
            toast.error(MESSAGES.err_must_choose_teacher, { autoClose: 3000 });
            return false;
        }
        return true;
    }

    handleChange(value) {
        let selected = this.state.teachers.find(teacher => value == teacher.id);

        if (selected)
        {
            // set data before call api for instant display without message
            this.setState({
                ...this.state,
                teacherId: selected.id,
                selectedTeacher: selected,
                summary: {
                    ...this.state.summary,
                    teacher: {
                        id: selected.id,
                        last_name: selected.last_name,
                        first_name: selected.first_name,
                    },
                },
            });
            this.props.onChange({
                teacher: {
                    id: selected.id,
                    last_name: selected.last_name,
                    first_name: selected.first_name,
                },
                summary: this.state.summary,
            });

            api.get(`/teachers/${selected.id}/with_overlap?startTime=${this.props.initialValues.firstDayStartTime}&endTime=${this.props.initialValues.firstDayEndTime}&fromDate=${this.props.initialValues.fromDate}&toDate=${this.props.initialValues.toDate}&recurrence=1`)
                .then(({ data, error }) =>
            {
                if (error) {
                    console.log(error);
                } else {
                    if (data.length != 0)
                    {
                        this.setState({
                            ...this.state,
                            teacherId: data.id,
                            selectedTeacher: data,
                            summary: {
                                ...this.state.summary,
                                teacher: {
                                    id: data.id,
                                    last_name: data.last_name,
                                    first_name: data.first_name,
                                },
                            },
                        });
                        this.props.onChange({
                            teacher: {
                                id: data.id,
                                last_name: data.last_name,
                                first_name: data.first_name,
                            },
                            summary: {
                                ...this.state.summary,
                                teacher: {
                                    id: data.id,
                                    last_name: data.last_name,
                                    first_name: data.first_name,
                                },
                            }
                        });
                    }
                }
            });
        }
    }

    render() {
        const href_path = this.props.href_path;
        const {
            firstDayEndTime,
            firstDayStartTime,
            teacherId,
            selectedTeacher,
            teachers,
            summary,
        } = this.state;

        let overlappedInterval = {};

        const isSameDay = (d1, d2) => {
            return (
                d1.getFullYear() === d2.getFullYear() &&
                d1.getMonth() === d2.getMonth() &&
                d1.getDate() === d2.getDate()
            );
        };

        const isAvailableInSlot = () => {
            const slotStart = new Date(firstDayStartTime);
            const slotEnd = new Date(firstDayEndTime);

            for (const availability of selectedTeacher.availabilities) {
                const availabilityStart = new Date(availability.start);
                const availabilityEnd = new Date(availability.end);

                const previousWeekSlotStart = new Date(slotStart);
                const previousWeekSlotEnd = new Date(slotEnd);

                previousWeekSlotStart.setDate(slotStart.getDay() - 7);
                previousWeekSlotEnd.setDate(slotEnd.getDay() - 7);

                if (
                    (availabilityStart <= previousWeekSlotStart &&
                        previousWeekSlotEnd <= availabilityEnd) ||
                    (availabilityStart <= slotStart &&
                        slotEnd <= availabilityEnd)
                ) {
                    return true;
                } else if (
                    isSameDay(slotStart, availabilityStart) ||
                    isSameDay(previousWeekSlotStart, availabilityStart)
                ) {
                    if (
                        (availabilityStart < slotStart &&  slotStart < availabilityEnd) ||
                        (availabilityStart < slotEnd &&  slotEnd < availabilityEnd) ||
                        (availabilityStart < previousWeekSlotStart &&  previousWeekSlotStart < availabilityEnd) ||
                        (availabilityStart < previousWeekSlotEnd &&  previousWeekSlotEnd < availabilityEnd)
                    ) {
                        overlappedInterval = {
                            start: moment(availability.start)
                                .format("HH:mm")
                                .replace(":", "h"),
                            end: moment(availability.end)
                                .format("HH:mm")
                                .replace(":", "h"),
                        };
                    }
                }
            }

            return false;
        };

        return (
            <div className="row">
                <div className="col-md-8">
                    <div className="ibox">
                        <div className="ibox-title flex">
                            <i className="fa fa-user m-sm"></i>
                            <h3>Choix du professeur</h3>
                        </div>
                        <div className="ibox-content">
                            <div className="row">
                                <div className="col-md-10">
                                    {teachers &&
                                        (teachers.length > 0 ? (
                                            <InputSelect
                                                input={{
                                                    name: "teacher",
                                                    onChange: e =>
                                                        this.handleChange(
                                                            e.target.value
                                                        ),
                                                    value: teacherId,
                                                }}
                                                meta={{}}
                                                label="Professeur"
                                                required={true}
                                                options={teachers.map(
                                                    teacher => {
                                                        return {
                                                            value: teacher.id.toString(),
                                                            label: `${teacher.first_name} ${teacher.last_name}`,
                                                        };
                                                    }
                                                )}
                                                button={{
                                                    icon: "fa fa-plus-circle",
                                                    href_path: `${href_path}/users/new`,
                                                    text: "",
                                                    tooltip:
                                                        "Ajouter un professeur",
                                                }}
                                            />
                                        ) : (
                                            <div className="alert alert-danger">
                                                Aucun professeur n'enseigne
                                                l'activité choisie.
                                            </div>
                                        ))}
                                </div>
                            </div>
                            {selectedTeacher && (
                                <div className="row">
                                    { selectedTeacher.availabilities && selectedTeacher.availabilities.length ==
                                        0 && (
                                        <div className="col-md-12">
                                            <div className="alert alert-warning">
                                                Ce professeur n'a pas renseigné
                                                de disponibilités.
                                            </div>
                                        </div>
                                    )}
                                    {selectedTeacher.has_overlap &&
                                        selectedTeacher.activity_overlapped && (
                                            <div className="col-md-12">
                                                <div className="alert alert-danger">
                                                    {`Ce créneau est déjà occupé pour ce professeur:
                                                 cours de ${selectedTeacher.activity_overlapped.activity_ref} de ${selectedTeacher.activity_overlapped.start} à ${selectedTeacher.activity_overlapped.end}  - ${selectedTeacher.activity_overlapped.room}.`}
                                                </div>
                                            </div>
                                        )}
                                    {selectedTeacher.availabilities && selectedTeacher.availabilities.length >
                                        0 &&
                                        !isAvailableInSlot() && (
                                            <div className="col-md-12">
                                                <div className="alert alert-danger">
                                                    <p>
                                                        Ce professeur n'est pas
                                                        disponible sur
                                                        l'ensemble du créneau
                                                        choisi
                                                    </p>
                                                    {Object.keys(
                                                        overlappedInterval
                                                    ).length > 0 && (
                                                        <p>
                                                            En revanche, il est
                                                            disponible de{" "}
                                                            {
                                                                overlappedInterval.start
                                                            }{" "}
                                                            à{" "}
                                                            {
                                                                overlappedInterval.end
                                                            }{" "}
                                                            ce même jour
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <AddCourseSummary
                        summary={summary}
                        handleSubmit={this.handleSubmit}
                    />
                </div>
            </div>
        );
    }
}
