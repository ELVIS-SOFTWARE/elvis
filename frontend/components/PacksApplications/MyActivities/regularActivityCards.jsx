import React, { Fragment, useState } from "react";
import moment from "moment";
import 'moment/locale/fr';
import packImgDefault from "../../../images/default_activity.png";
import _ from "lodash";

moment.locale('fr');

export default function regularActivityCard(props) {
    const { activityApplication, showTeacherContacts } = props;
    const desired_activities = activityApplication.desired_activities;

    return (
        <div className="d-flex flex-wrap">
            {desired_activities.map((desired_activity, index) => {
                const activity = desired_activity.activity;
                const activity_ref = desired_activity.activity_ref;
                const start = _.get(activity, 'closest_instance_from_now.start', null) || _.get(activity, 'time_interval.start', null);
                const end = _.get(activity, 'closest_instance_from_now.end', null) || _.get(activity, 'time_interval.end', null);

                const phoneNumber = (
                    showTeacherContacts &&
                    activity.teacher?.telephones?.length > 0
                ) ? activity.teacher.telephones[0].number : null;

                const hasEmail = showTeacherContacts && activity.teacher?.email;

                const contactInfoCount = (phoneNumber ? 1 : 0) + (hasEmail ? 1 : 0);

                return (
                    <div key={`desired-activity-${index}`} className="card activity-card my-3 mx-3 h-100">
                        <div className="card-img-wrapper">
                            <img
                                className="card-img-packs"
                                src={activity_ref.picture_path ? activity_ref.picture_path : packImgDefault}
                                alt="Card image cap"
                            />
                            <div className="card-banner-title background-green">
                                <p className="font-bold no-margin">Annuel</p>
                            </div>
                        </div>
                        <div
                            className="card-block d-flex flex-column justify-content-between h-100"
                            style={{ paddingBottom: '1rem' }}
                        >
                            <div>
                                <h4 className="card-title pl-4 pt-3" style={{ color: '#00283B' }}>
                                    {activity_ref.label}
                                </h4>
                                <p className="card-text pl-4" style={{ color: '#00334A' }}>
                                    {activity.room.label}
                                </p>
                                <p className="card-text pl-4">
                                    {moment(start).format('dddd') + " | " + moment(start).format('HH:mm') + " - " + moment(end).format('HH:mm')}
                                </p>
                            </div>

                            <div>
                                <div className="d-flex align-items-center pl-3 mb-3">
                                    <img
                                        className="rounded-circle"
                                        src="https://cdn-icons-png.flaticon.com/512/6596/6596121.png"
                                        alt="userPicture"
                                        style={{ height: '40px', width: '40px' }}
                                    />
                                    <p className="card-text ml-2 mb-0" style={{ color: '#00334A' }}>
                                        {activity.teacher.first_name + " " + activity.teacher.last_name}
                                    </p>
                                </div>

                                <div className="contact-info">
                                    {phoneNumber && (
                                        <p className="card-text pl-4" style={{
                                            color: '#00334A',
                                            textAlign: 'left',
                                            marginBottom: contactInfoCount < 2 ? '0.5rem' : '0.25rem'
                                        }}>
                                            <i className="fa fa-phone mr-2"></i> {phoneNumber}
                                        </p>
                                    )}
                                    {hasEmail && (
                                        <p className="card-text pl-4" style={{
                                            color: '#00334A',
                                            textAlign: 'left',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <i className="fa fa-envelope mr-2"></i> {activity.teacher.email}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}