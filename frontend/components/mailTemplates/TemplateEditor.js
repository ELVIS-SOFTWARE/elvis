import React, { useState, useEffect, Fragment } from 'react';
import ElvisEditor from "./ElvisEditor";
import * as MergeTags from './MergeTags';
import * as api from "../../tools/api";
import swal from "sweetalert2";

export default function TemplateEditor()  {
    const [mergeTags, setMergeTags] = useState(null);
    const [loading, setLoading] = useState(true);
    const [template, setTemplate] = useState(null);
    const [event, setEvent] = useState(null);

    const fetchData = async () => {
        await api.set()
            .success(res =>
            {
                setTemplate(res.template);
                setEvent(res.event);
                setLoading(false);
            })
            .error(res => {
                swal("Une erreur est survenue lors de la récupération des templates", res.error, "error");
            })
            .get( window.location.pathname + "", {});
    }

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        setMergeTags({ ...MergeTags.ACTIVITY_TAGS, ...MergeTags.APPLICATION_TAGS, ...MergeTags.PAYMENT_TAGS, ...MergeTags.REGLEMENTS_TAGS, ...MergeTags.UTILS_TAGS });
    }, [event]);

    if (!loading) {
        return (
            <Fragment>
                <div className="row wrapper border-bottom white-bg page-heading">
                    <h1>Édition de templates</h1>
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
                            <a
                                href="/notification_templates/"
                                className="btn btn-primary ml-4"
                            >
                                Revenir à la liste
                            </a>
                        </div>
                    </div>
                </div>
            </Fragment>
        );
    } else {
        return (<Fragment></Fragment>);
    }
};

