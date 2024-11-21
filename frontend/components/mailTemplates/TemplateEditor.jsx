import React, {useState, useEffect, Fragment} from 'react';
import ElvisEditor from "./ElvisEditor";
import * as MergeTags from './MergeTags';
import * as api from "../../tools/api";
import swal from "sweetalert2";

export default function TemplateEditor() {
    const [mergeTags, setMergeTags] = useState(null);
    const [loading, setLoading] = useState(true);
    const [template, setTemplate] = useState(null);
    const [templateName, setTemplateName] = useState(null);
    const [event, setEvent] = useState(null);

    const fetchData = async () => {
        try {
            await api.set()
                .success(res =>
                {
                    setTemplate(res.template);
                    setEvent(res.event);
                    setLoading(false);
                    setTemplateName(res.template.name);
                })
                .error(res => {
                    swal("Une erreur est survenue lors de la récupération des templates", res.error, "error");
                })
                .get( window.location.pathname + "", {});
        } catch (error) {
            swal("Erreur", "Impossible de récupérer les templates.", "error");
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!template) return;

        const mergeTagConfig = {
            'upcoming_payment_mailer/upcoming_payment': {
                ...MergeTags.UTILS_TAGS,
                ...MergeTags.APPLICATION_TAGS
            },
            'payment_reminder_mailer/send_payment_reminder': {
                ...MergeTags.APPLICATION_TAGS,
                ...MergeTags.PAYMENT_TAGS
            },
            'reglement_reminder_mailer/send_reglement_reminder': {
                ...MergeTags.APPLICATION_TAGS,
                ...MergeTags.REGLEMENTS_TAGS
            },
            'application_mailer/notify_new_application': {
                ...MergeTags.UTILS_TAGS,
                ...MergeTags.APPLICATION_TAGS,
                ...MergeTags.ACTIVITY_TAGS
            },
            'user_cancelled_attendance_mailer/cancelled_attendance': {
                ...MergeTags.UTILS_TAGS,
                ...MergeTags.APPLICATION_TAGS,
                ...MergeTags.ACTIVITY_INSTANCE_TAGS
            },
            'admin_cancelled_attendance_mailer/cancelled_attendance': {
                ...MergeTags.UTILS_TAGS,
                ...MergeTags.APPLICATION_TAGS,
                ...MergeTags.ACTIVITY_INSTANCE_TAGS
            },
            'activity_assigned_mailer/activity_assigned': {
                ...MergeTags.UTILS_TAGS,
                ...MergeTags.APPLICATION_TAGS,
                ...MergeTags.ACTIVITY_INSTANCE_TAGS
            },
            'activity_accepted_mailer/activity_accepted': {
                ...MergeTags.UTILS_TAGS,
                ...MergeTags.APPLICATION_TAGS,
                ...MergeTags.ACTIVITY_INSTANCE_TAGS
            },
            'activity_proposed_mailer/activity_proposed': {
                ...MergeTags.UTILS_TAGS,
                ...MergeTags.APPLICATION_TAGS,
                ...MergeTags.ACTIVITY_INSTANCE_TAGS
            },
            'adhesion_mailer/reminder_email': {
                ...MergeTags.UTILS_TAGS,
                ...MergeTags.APPLICATION_TAGS,
                ...MergeTags.ACTIVITY_INSTANCE_TAGS
            },
        };

        setMergeTags(mergeTagConfig[template.path] || {
            ...MergeTags.ACTIVITY_TAGS,
            ...MergeTags.ACTIVITY_INSTANCE_TAGS,
            ...MergeTags.APPLICATION_TAGS,
            ...MergeTags.PAYMENT_TAGS,
            ...MergeTags.REGLEMENTS_TAGS,
            ...MergeTags.UTILS_TAGS,
            ...MergeTags.SCHOOL_LOGO_TAGS,
        });
    }, [template]);

    if (loading) {
        return <Fragment/>;
    }

    return (
        <Fragment>
            <div className="row wrapper border-bottom white-bg page-heading">
                <h1>{templateName}</h1>
            </div>
            <div className="col-lg-12 col-sm-12">
                <div className="row w-100">
                    <div className="col-12">
                        <ElvisEditor
                            templateId={template.path}
                            templateBody={template.body}
                            templateJson={template.json}
                            mergeTags={mergeTags}
                        />
                    </div>
                    <div className="text-left">
                        <a href="/notification_templates/" className="btn btn-primary ml-4">
                            Revenir à la liste
                        </a>
                    </div>
                </div>
            </div>
        </Fragment>
    );
};
