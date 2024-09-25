import React from "react";
import {csrfToken} from "../utils";
import swal from "sweetalert2";
import ActivityRefBasics from "./ActivityRefBasics";
import ActivityRefApplication from "./ActivityRefApplication";
import TabbedComponent from "../utils/ui/tabs";
import WorkGroupTemplateEditor from "./WorkGroupTemplateEditor";
import {Form, Field, FormSpy} from "react-final-form";
import * as api from "../../tools/api.js";
import {redirectTo} from "../../tools/url";
import ActivityRefTeachers from "./ActivityRefTeachers";


export default class ActivityRefContainer extends React.Component {
    constructor(props) {
        super(props);
        const applicationOptions = this.buildApplicationOptions(this.props.activityRef);

        this.initialValues = {
            activityRef: this.props.activityRef,
            applicationOptions,
            substitutable: this.props.activityRef.substitutable.toString(),
            allowsTimeslotSelection:
                this.props.activityRef.allows_timeslot_selection === null ?
                    "false" :
                    this.props.activityRef.allows_timeslot_selection.toString(),
            nextCycles: this.props.nextCycles,
        };

        this.instruments = _(props.activityInstruments)
            .groupBy("id")
            .mapValues(_.size)
            .value();

        this.teachers = this.props.teachers;
        this.imageChanged = false;
        this.route =
            this.props.postTo === "update" ?
                `/activity_ref/${this.props.activityRef.id}/update`
                : `/activity_ref`;

        this.state = {
            pricingCategoriesToSave: [],
        };
    }

    buildApplicationOptions(activityRef) {
        const options = [];

        activityRef.has_additional_student && options.push("has_additional_student");
        activityRef.is_lesson && options.push("is_lesson");
        activityRef.is_visible_to_admin && options.push("is_visible_to_admin");
        activityRef.is_unpopular && options.push("is_unpopular");
        activityRef.is_evaluable && options.push("is_evaluable");

        return options;
    }

    addPricingCategoriesToSave(pricing) {
        // on ajoute le pricing à la liste des pricings à sauvegarder
        this.setState({
            pricingCategoriesToSave: [...this.state.pricingCategoriesToSave, pricing],
        });
    }

    updatePricingCategoriesToSave(updatedPricing) {
        // on met à jour le pricing dans la liste des pricings à sauvegarder
        this.setState({
            pricingCategoriesToSave: this.state.pricingCategoriesToSave.map(pricing => {
                if (pricing.id === updatedPricing.id) {
                    return updatedPricing;
                }
                return pricing;
            }),
        });
    }

    deletePricingCategoriesToSave(pricing) {
        // on supprime le pricing de la liste des pricings à sauvegarder
        this.setState({
            pricingCategoriesToSave: this.state.pricingCategoriesToSave.filter(p => p.id !== pricing.id),
        });
    }

    onWorkgroupChange({values}) {
        this.instruments = values;
    }


    /**
     * @param {[]} teachers
     */
    onTeachersChange(teachers) {
        this.teachers = teachers;
    }

    sendImage(activityRefId) {
        let formData = new FormData();
        formData.append("picture", this.image);

        fetch(`/activity_ref/${activityRefId}/picture`, {
            method: "post",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
            },
            body: formData,
        }).then(res => {
            if (res.ok) {
                res.json().then(json => {
                    redirectTo("/activity_ref");
                    swal({
                        type: "success",
                        title: "Enregistrement effectué",
                    });
                });
            } else {
                swal({
                    type: "error",
                    title: "Une erreur est survenue",
                });
            }
        });

    }

    onSubmit(values) {

        // on prépare les valeurs pour envoi à l'API
        var activityRef = {
            id: this.props.activityRef.id,
            label: values.activityRef.label,
            activity_ref_kind_id: values.activityRef.activity_ref_kind_id,
            occupation_limit: values.activityRef.occupation_limit,
            occupation_hard_limit: values.activityRef.occupation_hard_limit,
            from_age: values.activityRef.from_age,
            to_age: values.activityRef.to_age,
            activity_type: values.activityRef.activity_type || "",
            nb_lessons: values.activityRef.nb_lessons || null,
            next_cycles: values.nextCycles,
            has_additional_student: values.applicationOptions.includes("has_additional_student"),
            is_lesson: values.applicationOptions.includes("is_lesson"),
            is_visible_to_admin: values.applicationOptions.includes("is_visible_to_admin"),
            is_unpopular: values.applicationOptions.includes("is_unpopular"),
            is_evaluable: values.applicationOptions.includes("is_evaluable"),
            allows_timeslot_selection: values.allowsTimeslotSelection === "true",
            substitutable: values.substitutable === "true",
            is_work_group: values.activityRef.is_work_group,
            instruments: this.instruments,
            users: (this.teachers || []).map(t => t.id),
            pricings: this.state.pricingCategoriesToSave,
            duration: values.activityRef.duration,
        };

        api
            .set()
            .success((res) => {
                if (this.imageChanged) {
                    const activityRefId =
                        this.props.postTo == "create" ?
                            res.activityRefId
                            : activityRef.id;

                    this.sendImage(activityRefId);

                } else {
                    redirectTo("/activity_ref");
                    swal({
                        type: "success",
                        title: "Enregistrement effectué",
                    });
                }

            })
            .error((msg) => {
                console.log("error updating activity ref : ", msg);
                swal({
                    type: "error",
                    title: "Une erreur est survenue",
                });

            })
            .post(this.route, {activity_ref: activityRef});

    }

    onValidate(values) {
        const errors = {activityRef: {}};

        if (isIntStrInf(values.activityRef.occupation_hard_limit, values.activityRef.occupation_limit))
            errors.activityRef.occupation_hard_limit = "doit être supérieur au nombre de places";

        if (isIntStrInf(values.activityRef.to_age, values.activityRef.from_age))
            errors.activityRef.to_age = "doit être supérieur à l'âge min";

        return errors;
    }

    onImageChange(file) {
        this.image = file;
        this.imageChanged = true;
    }

    render() {
        return (
            <div className="col-lg-12 page-reglement">
                <Form
                    onSubmit={this.onSubmit.bind(this)}
                    validate={this.onValidate}
                    initialValues={this.initialValues}

                    render={({handleSubmit}) => (
                        <form onSubmit={handleSubmit}>

                            <TabbedComponent tabs={[

                                // les caractéristiques principales de l'activité
                                {
                                    id: "activity_ref_basics",
                                    header: "Activité",
                                    body: <ActivityRefBasics
                                        activityRef={this.props.activityRef}
                                        activityTypes={this.props.activityTypes}
                                        activityRefImage={this.props.activityRefImage}
                                        activityRefKinds={this.props.activityRefKinds}
                                        onImageChange={this.onImageChange.bind(this)}
                                        seasons={this.props.seasons}
                                        addPricingCategoriesToSave={this.addPricingCategoriesToSave.bind(this)}
                                        updatePricingCategoriesToSave={this.updatePricingCategoriesToSave.bind(this)}
                                        deletePricingCategoriesToSave={this.deletePricingCategoriesToSave.bind(this)}
                                    />,
                                },

                                // ce qui est en rapport avec l'inscription
                                {
                                    id: "activity_ref_application",
                                    header: "Inscription",
                                    body: <ActivityRefApplication
                                        activityRefs={this.props.activityRefs}
                                        substitutable={this.initialValues.substitutable}
                                    />,
                                },

                                // les instruments éventuellement liés à l'atelier
                                {
                                    id: "activity_ref_workgroup",
                                    header: "Atelier",
                                    body: <WorkGroupTemplateEditor
                                        activityRefId={this.props.activityRef.id}
                                        activityInstruments={this.props.activityInstruments}
                                        instruments={this.props.instruments}
                                        onChange={this.onWorkgroupChange.bind(this)}
                                    />,
                                },
                                {
                                    id: "activity_ref_teachers",
                                    header: "Professeurs",
                                    body: <ActivityRefTeachers
                                        teachers={this.props.teachers}
                                        onChange={this.onTeachersChange.bind(this)}
                                    />,
                                },

                            ]}>

                            </TabbedComponent>


                            <div style={{padding: 20, display: "flex", justifyContent: "flex-end", gap: "20px"}}>
                                <div>
                                    <button type="reset" className="btn btn-block">Annuler</button>
                                </div>
                                <div>
                                    <button type="submit" className="btn btn-primary btn-block">Valider</button>
                                </div>
                            </div>
                        </form>
                    )}
                />

            </div>
        );
    }
}

function isIntStrInf(str1, str2) {
    return (intOrUndefined(str1) || str1) < (intOrUndefined(str2) || str2);
}

function intOrUndefined(str) {
    const val = parseInt(str);

    return isNaN(val) ? undefined : val;
}