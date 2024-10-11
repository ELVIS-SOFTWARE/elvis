import React, { Fragment } from "react";
import { fullname } from "../../tools/format";

// SUB COMPONENTS
const TeacherItem = ({ schedule, teachers }) => {
    if (!schedule.activityInstance.cover_teacher_id) {
        return (
            <ListItem label="Enseignant" value={fullname(schedule.teacher)} />
        );
    }

    const coverTeacher = _.find(
        teachers,
        t => t.id === schedule.activityInstance.cover_teacher_id
    );

    if (!coverTeacher) {
        return null;
    }

    return (
        <li className="list-group-item">
            <p>
                <span className="font-bold">{"Enseignant"}</span>
                {" : "}
                {fullname(schedule.teacher)}
            </p>
            <p>
                <span className="font-bold">{"Remplacé par"}</span>
                {" : "}
                {fullname(coverTeacher)}
            </p>
            <p>
                <span className="font-bold">
                    {"Heures comptées pour le professeur absent"}
                </span>
                {" : "}
                {schedule.activityInstance.are_hours_counted ? "Oui" : "Non"}
            </p>
        </li>
    );
};

const ListItem = ({ label, value }) => (
    <li className="list-group-item">
        <span className="font-bold">{label}</span>
        {" : "}
        {value}
    </li>
);

const AvailabilityIntervalContent = ({schedule, onClose}) => <Fragment>
    <h3>{"Détails de la disponibilité"}</h3>

    <ul class="list-group">
        <ListItem
            label="Horaires"
            value={`${schedule.start._date.toLocaleString()} - ${schedule.end._date.toLocaleString()}`} />
        {schedule.raw.comment && <ListItem
            label="Commentaire"
            value={schedule.raw.comment.content} />}
    </ul>
</Fragment>;

const ValidatedIntervalContent = ({schedule, attendees, teachers, onClose}) => <Fragment>
    <h3>{"Détails du créneau"}</h3>

    <ul className="list-group">
        {schedule.activity && schedule.activity.group_name ? (
            <ListItem
                label="Groupe"
                value={schedule.activity.group_name}
            />
        ) : null}
        <ListItem label="Cours" value={schedule.title} />
        <ListItem label="Salle" value={schedule.location} />
        <ListItem
            label="Horaires"
            value={`${schedule.start._date.toLocaleString()} - ${schedule.end._date.toLocaleString()}`}
        />
        <TeacherItem teachers={teachers} schedule={schedule} />
        <ListItem
            label="Elèves"
            value={
                attendees.length ? (
                    <ul>{attendees}</ul>
                ) : (
                    <span>{"Aucun"}</span>
                )
            }
        />
        {schedule.raw.comment && <ListItem
            label="Commentaire"
            value={schedule.raw.comment.content} />}
    </ul>

    <div className="flex flex-center-justified">
        <button className="btn btn-primary" onClick={onClose}>
            <i className="fas fa-times m-r-sm"></i>
            {"Fermer"}
        </button>
    </div>
</Fragment>;

// MAIN COMPONENT
class MultiViewModal extends React.PureComponent {
    constructor(props) {
        super(props);
    }

    render() {
        const { schedule, teachers, onClose } = this.props;

        // Do not render if schedule is falsy
        if (!schedule) {
            return null;
        }

        if(!schedule.activityInstance)
            return <AvailabilityIntervalContent
                    schedule={schedule}
                    onClose={onClose} />;

        // Map attendees
        const attendees = Array.isArray(schedule.attendees)
            ? schedule.attendees.map(attendee => (
                  <li key={attendee.id}>{fullname(attendee)}</li>
              ))
            : [];

        // Render
        return <ValidatedIntervalContent
            teachers={teachers}
            schedule={schedule}
            onClose={onClose}
            attendees={attendees} />;
    }
}

export default MultiViewModal;
