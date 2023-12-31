import React, {useState} from "react";
import teacherImgDefault from "../../../images/default_teacher.png";

export default function activityCards(props) {
    const {pack} = props;
    const activity_ref = pack.activity_ref;
    const [isHovered, setIsHovered] = useState(false);

    function getRemainingLessons() {
        if (pack.lessons_remaining === 1)
            return "1 séance restante";
        else
            return pack.lessons_remaining + " séances restantes";
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

    return (
        <div
            className="col-md-4 mt-3 activity-card"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="card" style={{ height: '100%' }}>
                <div className="card-img-wrapper">
                    <img
                        className="card-img-packs img-fluid"
                        src={activity_ref.picture_path}
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
                        {checkForMultipleRooms()
                            ? 'Multiples salles'
                            : activity_ref.activities[0].room.label
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
                            {checkForMultipleTeachers()
                                ? 'Multiples professeurs'
                                : activity_ref.activities[0].teacher.first_name +
                                  ' ' +
                                  activity_ref.activities[0].teacher.last_name
                            }
                        </p>
                    </div>
                    {isHovered && (
                        <div className="card-banner-bottom animated fadeIn">
                            <a
                                className="text-white font-bold pl-4"
                                href={`${window.location.pathname}/bookActivity/${pack.id}`}
                            >
                                RÉSERVER <span className="pull-right pr-3"> > </span>
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}