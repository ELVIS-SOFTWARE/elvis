import React, {useState} from "react";
import teacherImgDefault from "../../../images/default_teacher.png";
import packImgDefault from "../../../images/default_activity.png";

export default function activityCards(props) {
    const {pack} = props;
    const activity_ref = pack.activity_ref;
    // const [isHovered, setIsHovered] = useState(false);

    function getRemainingLessons() {
        if (pack.lessons_remaining === 1)
            return "1 séance restante";
        else
            return pack.lessons_remaining + " séances restantes";
    }

    function checkIfActivities() {
        return pack.activity_ref.activities.length > 1;
    }

    function checkForMultipleTeachers() {
        let teachers = [];
        pack.activity_ref.activities.forEach(activity => {
            if (!teachers.includes(activity.teacher.first_name + " " + activity.teacher.last_name))
                teachers.push(activity.teacher.first_name + " " + activity.teacher.last_name);
        });
        return teachers.length > 1;
    }

    function checkForMultipleRooms() {
        let rooms = [];
        pack.activity_ref.activities.forEach(activity => {
            if (!rooms.includes(activity.room.label))
                rooms.push(activity.room.label);
        });
        return rooms.length > 1;
    }

    console.log(activity_ref.picture_path)

    return (
        <div
            className="col-md-4 mt-3 activity-card"
            // onMouseEnter={() => setIsHovered(true)}
            // onMouseLeave={() => setIsHovered(false)}
        >
            <div className="card" style={{ height: '100%' }}>
                <div className="card-img-wrapper">
                    <img
                        className="card-img-packs img-fluid"
                        src={activity_ref.picture_path ? activity_ref.picture_path : packImgDefault}
                        alt="Card image cap"
                    />
                    <div className="card-banner-title background-red">
                        <p className="font-bold no-margin">{getRemainingLessons()}</p>
                    </div>
                </div>
                <div className="card-block" style={{ height: '50%' }}>
                    <h4 className="card-title pl-4 pt-3" style={{ color: '#00283B' }}>
                        {activity_ref.label}
                    </h4>
                    <p className="card-text pl-4" style={{ color: '#00334A' }}>
                        {checkIfActivities() ? checkForMultipleRooms() ?
                            'Multiples salles' : activity_ref.activities[0].room.label
                            : "Aucune salle"
                        }
                    </p>
                    <div className="d-flex align-items-center pl-3">
                        <img
                            className="rounded-circle"
                            src={teacherImgDefault}
                            alt="userPicture"
                            style={{ height: '30px', width: '30px' }}
                        />
                        <p className="card-text ml-2" style={{ color: '#00334A' }}>
                            {checkIfActivities() ? checkForMultipleTeachers() ?
                                'Multiples professeurs' : activity_ref.activities[0].teacher.first_name + " " + activity_ref.activities[0].teacher.last_name
                                : "Aucun professeur"
                            }
                        </p>
                    </div>
                    {/*{isHovered && (*/}
                        <a
                            className="card-banner-bottom background-blue animated fadeIn"
                            href={`${window.location.pathname}/bookActivity/${pack.id}`}
                        >
                            <div className="text-white font-bold pl-4">
                                RÉSERVER <span className="pull-right pr-3"> > </span>
                            </div>
                        </a>
                    {/*)}*/}
                </div>
            </div>
        </div>
    );
}