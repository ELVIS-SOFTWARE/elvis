import React, {Fragment} from "react";
import _ from "lodash";
import moment from "moment";

require("moment/locale/fr");

import StepZilla from "react-stepzilla";

import ActivityChoice from "./ActivityChoice";
import Evaluation from "./Evaluation";
import Validation from "./Validation";

import UserForm from "../userForm/UserForm";

import {findAndGet, ISO_DATE_FORMAT} from "../utils";
import TimePreferencesStep, {
    PLANNING_AND_PREFERENCES_MODE,
    PLANNING_MODE,
    PREFERENCES_MODE,
} from "./TimePreferencesStep";
import EvaluationIntervalChoice from "./EvaluationIntervalChoice";
import * as api from "../../tools/api.js";
import {generateUserInfos, infosFromUser} from "../../tools/obj";
import {toast} from "react-toastify";
import ApplicationChangeQuestionnaire from "./ApplicationChangeQuestionnaire";
import UserSearch from "./UserSearch";
import {PRE_APPLICATION_ACTIONS} from "../../tools/constants";
import Select from "react-select";
import Swal from 'sweetalert2'
import WrappedPayerPaymentTerms from "../WrappedPayerPaymentTerms";
import WizardUserSelectMember from "./WizardUserSelectMember";
import WrappedFormulaChoice from "./WrappedFormulaChoice";
import WrappedActivityChoice from "./WrappedActivityChoice";

const ALREADY_PRACTICED_INSTRUMENT_QUESTION_NAME =
    "already_practiced_instrument";

class Wizard extends React.Component {
    constructor(props) {
        super(props);

        const user = this.props.user;

        const intervals = this.props.availabilities || [];

        this.state = {
            user: user,
            comment: "",
            personSelection: "other",
            possibleMatches: [],
            selectedActivities: [],
            selectedPacks: {},
            selectedFormulas: [],
            selectedFormulaActivities: {},
            intervals,
            additionalStudents: [],
            childhoodTimeAvailabilities: [],
            childhoodPreferences: {},
            buttonDisabled: false,
            errors: [],
            infos: generateUserInfos(),
            season: this.props.season,
            season_id: (this.props.season || {}).id,
            begin_at: moment((this.props.season || {}).start).format(ISO_DATE_FORMAT),
            activityRefs: this.props.activityRefs,
            activityRefsChildhood: this.props.activityRefsChildhood,
            levelQuestionnaireAnswers: {},
            applicationChangeAnswers: {},
            learnedActivities: this.props.learnedActivities,
            practicedInstruments: [],
            selectedEvaluationIntervals: {},
            dayForCollection: {day: null},
            paymentTermsId: {id: null},
            availPaymentScheduleOptions: this.props.availPaymentScheduleOptions,
            availPaymentMethods: this.props.availPaymentMethods,
        };

        this.state.shouldCheckGdpr = !this.state.infos.checked_gdpr;
    }

    isInAgeRange(a) {
        if (a.activity_type === "child") {
            // const birthday = moment(infos.birthday);
            // const nextBirthday = moment(infos.birthday).year(seasonStart.year());
            // const age = nextBirthday.diff(birthday, "years");

            // return a.from_age <= age && age < a.to_age;
            return true;
        } else {
            // const seasonEnd = moment(season.end)
            const seasonEnd = moment(); // tmp : reset the calculated age to "relative from today"
            const userAge = seasonEnd.diff(moment(this.state.infos.birthday), "years");
            return userAge >= a.from_age && userAge <= a.to_age;
        }
    }

    componentDidMount() {
        if (!this.props.season) return;


        if (this.props.preSelectedUser) {
            api.post("/users/search?auth_token=" + this.props.user.authentication_token,
                {
                    first_name: this.props.preSelectedUser.first_name,
                    last_name: this.props.preSelectedUser.last_name,
                    birthday: this.props.preSelectedUser.birthday,
                    season_id: this.props.season.id,
                }
            ).then((data, errors) => {
                if (!errors) {
                    let user
                    if(this.props.preSelectedUser.id !== undefined)
                        user = data.data.filter(u => u.id === this.props.preSelectedUser.id ).shift()
                    else
                        user = data.data.shift()
                    this.handleSelectUser(user)
                }
            })
        } else if (this.props.user) {
            api.post("/users/search?auth_token=" + this.props.user.authentication_token,
                {
                    first_name: this.props.user.first_name,
                    last_name: this.props.user.last_name,
                    season_id: this.props.season.id,
                }
            ).then((data, errors) => {
                if (!errors) {
                    let user
                    if(this.props.user.id !== undefined)
                        user = data.data.filter(u => u.id === this.props.user.id ).shift()
                    else
                        user = data.data.shift()
                    this.handleSelectUser(user)
                }
            })
        }
    }

    handleUpdateFormulaActivities(formulaId, activities) {
        this.setState({
            selectedFormulaActivities: {
                ...this.state.selectedFormulaActivities,
                [formulaId]: activities
            }
        });
    }

    handleAddFormula(formulaId) {
        let newSelectedFormulas = [...this.state.selectedFormulas];

        if (_.includes(newSelectedFormulas, formulaId)) {
            _.pull(newSelectedFormulas, formulaId);
        } else {
            newSelectedFormulas = [...newSelectedFormulas, formulaId];
        }

        this.setState({ selectedFormulas: newSelectedFormulas }, () => {
            const newTotalPrice = newSelectedFormulas.reduce(
                (acc, f) => acc + parseFloat(f.display_price || 0),
                0
            );
            this.setState({ totalPrice: newTotalPrice });
        });
    }

    handleRemoveFormula(formulaId) {
        let newSelectedFormulas = [...this.state.selectedFormulas];

        _.pull(newSelectedFormulas, formulaId);

        this.setState({ selectedFormulas: newSelectedFormulas });

        const newSelectedFormulaActivities = { ...this.state.selectedFormulaActivities };
        delete newSelectedFormulaActivities[formulaId];
        this.setState({ selectedFormulaActivities: newSelectedFormulaActivities });

        const newTotalPrice = newSelectedFormulas.reduce(
            (acc, f) => acc + parseFloat(f.display_price || 0),
            0
        );
        this.setState({ totalPrice: newTotalPrice });
    }


    handleSelectActivities(activityId) {
        let newSelectedActivities = [...this.state.selectedActivities];
        if (_.includes(newSelectedActivities, activityId)) {
            // We remove it if it already exists
            _.pull(newSelectedActivities, activityId);
        } else {
            newSelectedActivities = [...newSelectedActivities, activityId];
        }

        this.setState({selectedActivities: newSelectedActivities});
    }

    handleUpdateLevelInits() {
        const personalLevels = _.reduce(
            _.uniq(this.state.selectedActivities),
            (map, obj) => {
                map[obj] = "1";
                return map;
            },
            {}
        );
        this.setState({personalLevels: personalLevels});
    }

    handleRemoveActivity(activityRefId) {
        // updating selected activities array
        let newSelectedActivities = [...this.state.selectedActivities];
        _.pullAt(
            newSelectedActivities,
            _.indexOf(newSelectedActivities, activityRefId)
        );

        let additionalStudents = [...this.state.additionalStudents];
        if (
            _.find(
                this.props.allActivityRefs,
                actRef => actRef.id == activityRefId
            ).has_additional_student
        ) {
            _.pullAt(
                additionalStudents,
                _.findIndex(
                    additionalStudents,
                    param => param[0] == activityRefId
                )
            );
        }

        if (this.state.childhoodPreferences[activityRefId]) {
            this.setState({
                childhoodPreferences: _.omit(
                    this.state.childhoodPreferences,
                    activityRefId
                ),
            });
        }

        // updating the state, then updating level initializations
        this.setState(
            {
                selectedActivities: newSelectedActivities,
                additionalStudents,
            },
            () => this.handleUpdateLevelInits()
        );
    }

    handleChangeSeason(season_id) {
        const newSeason = this.props.seasons.find(
            s => s.id === parseInt(season_id)
        );

        this.setState({
            season: newSeason,
            season_id: newSeason.id,
            begin_at: moment(newSeason.start).format(ISO_DATE_FORMAT),
        });

        this.state.infos.id && api
            .set()
            .success(family => {
                this.setState({
                    infos: {
                        ...this.state.infos,
                        family,
                    },
                });
            })
            .error(toast.error)
            .post(`/users/${this.state.infos.id}/family_links_with_user`, {season_id});
    }

    handleChangeBeginAt(begin_at) {
        this.setState({begin_at});
    }

    handleAddActivity(activityRefId) {
        // updating selected activities array
        let newSelectedActivities = [...this.state.selectedActivities];
        newSelectedActivities = [...newSelectedActivities, activityRefId];

        let additionalStudents = [...this.state.additionalStudents];
        if (
            _.find(
                this.props.allActivityRefs,
                actRef => actRef.id == activityRefId
            ).has_additional_student
        ) {
            additionalStudents = [...additionalStudents, [activityRefId, null]];
        }

        this.setState(
            {
                selectedActivities: newSelectedActivities,
                additionalStudents,
            },
            () => this.handleUpdateLevelInits()
        );
    }

    handleAddPack(key, packId) {
        // add to selected packs the key and the pack id combo if it doesn't exist or if isn't already in the array
        let newSelectedPacks = {...this.state.selectedPacks};
        if (!newSelectedPacks[key] || !_.includes(newSelectedPacks[key], packId)) {
            newSelectedPacks[key] = [...(newSelectedPacks[key] || []), packId];
        }

        this.setState({
                selectedPacks: newSelectedPacks,
            }
        );
    }

    handleRemovePack(key, packId) {
        // remove the pack id from the selected packs array if it exists, remove the key if the array is empty
        let newSelectedPacks = {...this.state.selectedPacks};
        if (newSelectedPacks[key]) {
            _.pull(newSelectedPacks[key], packId);
            if (newSelectedPacks[key].length === 0) {
                delete newSelectedPacks[key];
            }
        }

        this.setState({
                selectedPacks: newSelectedPacks,
            }
        );
    }

    handleChangeIntervals(intervals) {
        this.setState({intervals});
    }

    handleRedirectToExistingApplication() {
        document.location.href = `/inscriptions/${this.state.infos.activity_application.id}`;
    }

    handleUpdateChildhoodPreferences(preferences) {
        this.setState({
            childhoodPreferences: preferences,
        });
    }

    handleLevelAnswersChange(answers) {
        // check if student has answered the question which let us decide
        // if they need to schedule a meeting for level evaluation.
        const question = this.props.new_student_level_questions.find(
            q => q.name === ALREADY_PRACTICED_INSTRUMENT_QUESTION_NAME
        );

        const practicedInstruments = question
            ? Object.entries(answers)
                .reduce(
                    (acc, [refId, {[question.id]: answer}]) => [
                        ...acc,
                        answer === "true" && parseInt(refId),
                    ],
                    []
                )
                .filter(e => e)
            : [];

        const selectedEvaluationIntervals = {
            ...practicedInstruments.reduce(
                (acc, id) => ({
                    ...acc,
                    [id]: null,
                }),
                {}
            ),
        };

        this.setState({
            levelQuestionnaireAnswers: answers,
            practicedInstruments,
            selectedEvaluationIntervals,
        });
    }

    handleApplicationChangeAnswersChange(answers) {
        this.setState({
            applicationChangeAnswers: answers,
        });
    }

    handleUpdateSelectedEvaluationIntervals(selectedEvaluationIntervals) {
        this.setState({
            selectedEvaluationIntervals,
        });
    }

    handleAddAvailability(intervals) {
        this.setState({intervals: this.state.intervals.concat(intervals)});
    }

    handleDeleteAvailability(intervals) {
        this.setState({intervals});
    }

    handleUpdateInstruments(ids) {
        const instruments = this.props.instruments.filter(({id}) => ids.includes(id));
        this.setState({
            infos: {
                ...this.state.infos,
                instruments,
            },
        });
    }

    handleSubmit() {
        this.setState({ buttonDisabled: true });

        const state = { ...this.state };

        const individualActivities = Array.isArray(state.selectedActivities)
            ? state.selectedActivities
            : [];


        const formulaActivities = Object.values(state.selectedFormulaActivities || {}).flat();

        state.selectedFormulas = Array.isArray(this.state.selectedFormulas)
            ? this.state.selectedFormulas.map(f => (typeof f === "object" ? f.id : f))
            : [];


        const allSelectedActivities = Array.from(new Set([...individualActivities, ...formulaActivities]));
        state.selectedActivities = allSelectedActivities;

        state.selectedFormulaActivities = {};


        const authToken = _.get(this.state, "infos.authenticationtoken");

        api.set()
            .success((data) => {
                this.setState({ buttonDisabled: false });

                const user = this.state.user;
                const title = `<h5>Bonjour <b>${user.first_name} ${user.last_name}</b></h5>`;
                let htmltext = '';
                const confirmtext = 'Redirection';

                if (data.activity_application !== null) {
                    htmltext += '<p>'
                        + '<b>Votre demande d\'inscription a bien été prise en compte</b><br/>'
                        + 'Le numéro d\'identification de votre demande d\'inscription est :<br/>'
                        + `<b>${data.activity_application.id}</b><br/>`
                        + 'Un email récapitulatif de votre inscription va vous être envoyé sur votre adresse mail<br/>'
                        + 'Vous allez être automatiquement redirigé vers l\'accueil du site'
                        + '</p>';
                }

                if (data.pack_created || data.pack_created !== false) {
                    htmltext += '<p>'
                        + '<b>Vos packs de séances vous ont bien été attribués</b><br/>'
                        + '</p>';
                }

                Swal.fire({
                    title: title,
                    html: htmltext,
                    timer: 10000,
                    allowOutsideClick: false,
                    confirmButtonText: confirmtext,
                })
                    .then((result) => {
                        if (this.props.newApplicationForExistingUser || !this.props.currentUserIsAdmin || data.activity_application === null) {
                            window.location.href = `/new_application/${this.state.user.id || _.get(data, "activity_application.user_id")}`;
                        } else {
                            window.location.href = `/inscriptions/${data.activity_application.id}`;
                        }
                    });
            })
            .error(data => {
                this.setState({buttonDisabled: false });

                Swal({
                    title: "Erreur",
                    text: [...data].join(",") || "Une erreur est survenue lors de la création de votre demande d\'inscription",
                    type: "error",
                });

                console.error([...data].join("\n"));
            })
            .post(`/inscriptions${authToken ? `?auth_token=${authToken}` : ""}`, {
                application: state,
                actionType: this.props.actionType,
                preApplicationActivityId: _.get(this.props.preApplicationActivity, "id"),
            });
    }

    prepareForActivityChoice() {
        let cycleActivityRefs = [
            ...this.props.activityRefs,
            ...this.props.activityRefsChildhood,
        ];

        if (
            this.props.preApplicationActivity &&
            this.props.preApplicationActivity.activity.activity_ref.next_cycles
                .length
        ) {
            const cycleIds = this.props.preApplicationActivity.activity.activity_ref.next_cycles.map(
                c => c.to_activity_ref_id
            );

            // We remove activities that aren't part of the current student
            // activity cycle
            cycleActivityRefs = cycleActivityRefs.filter(a =>
                cycleIds.includes(a.id)
            );
        }

        // on considère qu'il y a un changement d'activité
        //      1. s'il y a une préinscription sur une activité
        //  et  2. si ce n'est pas une activité enfance
        this.state.isApplicationChange = this.props.preApplicationActivity &&
            _.get(
                this.props.preApplicationActivity,
                "activity.activity_ref.activity_type"
            ) !== "child";

        // Pre select current activity (e.g. guitar) for applications with a change
        if (this.state.isApplicationChange) {
            ////////////////////

            this.state.selectedActivities.push(
                _.get(
                    this.props.preApplicationActivity,
                    "activity.activity_ref_id"
                )
            );
        }

        // si on a reçu une activité en présélection, on en tient compte
        if (this.props.preSelectedActivityId) {
            this.setState({
                selectedActivities: [this.props.preSelectedActivityId]
            })
            this.state.selectedActivities = [this.props.preSelectedActivityId];

            // sinon on regarde si on peut en déduire une
        } else if (cycleActivityRefs.length) {
            // Pre select when there is only one activity to select
            if (cycleActivityRefs.length === 1
                && !this.state.selectedActivities.includes(cycleActivityRefs[0].id)
                && this.isInAgeRange(cycleActivityRefs[0])
            ) {
                this.setState({
                    selectedActivities: [cycleActivityRefs[0].id]
                })
            }

            // Otherwise split activities between childhood and not
            this.setState({
                activityRefs: cycleActivityRefs.filter(
                    r => r.activity_type !== "child"
                ),
                activityRefsChildhood: cycleActivityRefs.filter(
                    r => r.activity_type === "child"
                )
            })
        }

        this.setState({
            skipActivityChoice: (this.state.selectedActivities.length === 1 && Object.keys(this.props.packs || {}).length === 0 )|| this.state.isApplicationChange
        })
    }

    handleSelectUser(user) {
        const learnedActivities = _(user.activity_applications)
            .map("desired_activities")
            .flatten()
            .filter("is_validated")
            .map("activity_ref_id")
            .uniq()
            .value();

        const state = {
            infos: infosFromUser(user),
            learnedActivities,
            intervals: user.planning !== undefined && user.planning.time_intervals
                ? user.planning.time_intervals.filter(interval =>
                    !interval.is_validated && (interval.start > this.props.season.start) && (interval.start < this.props.season.end)
                )
                : [],
            user: user,
        };

        const family = state.infos.family_links_with_user;
        const user_infos = state.infos;
        const familyPayers = family.filter(user => user.is_paying_for).map(user => user.id);
        state.infos.payers = (user_infos.is_paying ? [...familyPayers, user_infos.id] : familyPayers ) || [];

        this.setState(state);

        this.prepareForActivityChoice();
    }

    handleComment(text) {
        this.setState({comment: text});
    }

    handleUserFormSubmit(values) {
        if (!this.state.user) {
            api.set()
                .success(data => {
                    this.handleSelectUser(data.user)
                })
                .error((errors) => {
                    // TODO : HANDLE ERROR
                    console.log(errors)
                })
                .post("/u", {
                    user: values,
                    has_mdp: true,
                })
        } else {
            this.setState({
                infos: {...this.state.infos, ...values},
            })
        }

    }

    handleChangePaymentInfo(key, value) {
        const paymentTerms = [...(this.state.infos.payer_payment_terms || [])];
        let paymentTerm = paymentTerms.find(term => term.season_id == this.state.season_id);

        if (paymentTerm) {
            paymentTerm[key] = value;
        } else {
            paymentTerm = {
                season_id: this.state.season_id,
                [key]: value
            };
            paymentTerms.push(paymentTerm);
        }

        this.setState({
            infos: {
                ...this.state.infos,
                payer_payment_terms: paymentTerms
            }
        });
    }

    handleChangePaymentTerms(paymentScheduleOptionsId) {
        this.handleChangePaymentInfo('payment_schedule_options_id', paymentScheduleOptionsId);
    }

    handleChangePaymentMethod(paymentMethodId) {
        this.handleChangePaymentInfo('payment_method_id', paymentMethodId);
    }

    handleChangeDayForCollection(dayForCollection)
    {
        const paymentTerms = [...(this.state.infos.payer_payment_terms || [])];
        const paymentTerm = paymentTerms.find(term => term.season_id == this.state.season_id);

        if (paymentTerm)
        {
            paymentTerm.day_for_collection = dayForCollection;
        }

        this.setState({
            infos: {
                ...this.state.infos,
                payer_payment_terms: paymentTerms
            }
        });
    }

    handleChangePayers(payers, eventUser) {
        const isEventUserSelected = payers.includes(eventUser.id);

        this.setState({
            infos: {
                ...this.state.infos,
                payers: payers || [],
                is_paying: payers.includes(this.state.infos.id),
                family_links_with_user: this.state.infos.family_links_with_user.map(user =>
                {
                    if(this.userEquals(user, eventUser))
                        user.is_paying_for = isEventUserSelected;
                    else
                        user.is_paying_for = payers.includes(user.id);

                    return user;
                })
            }
        });
    }


    getLabelsFromSelectedActivities() {
        let selectedActivityRefIds = this.state.selectedActivities.slice();

        if (this.state.selectedFormulaActivities) {
            Object.values(this.state.selectedFormulaActivities).forEach(activities => {
                activities.forEach(activityId => {
                    if (!selectedActivityRefIds.includes(activityId)) {
                        selectedActivityRefIds.push(activityId);
                    }
                });
            });
        }

        // Lister les activités qui nécessitent une sélection de préférences
        const prefsReqActivityRefIds = this.props.allActivityRefs
            .filter(ref => ref.allows_timeslot_selection)
            .map(ref => ref.id);

        // Filtrer notre sélection pour ne conserver que les activités qui ne nécessitent pas de préférences
        selectedActivityRefIds = selectedActivityRefIds.filter(activity => !prefsReqActivityRefIds.includes(activity));

        // Retourner un tableau avec les noms des activités sélectionnées
        return selectedActivityRefIds.reduce((labels, id) => {
            const element = this.props.allActivityRefs.find(activityRef => activityRef.id === id);
            if (element) {
                labels.push(element.display_name);
            }
            return labels;
        }, []);
    }

    isApplicationAuthorized(season_id)
    {
        if(this.props.currentUserIsAdmin)
            return true;

        const season = this.props.seasons.find(s => s.id === season_id);

        if(!season)
            return false;

        const dateToUse = this.props.preApplicationActivity ? season.opening_date_for_applications : season.opening_date_for_new_applications;

        return moment().isBetween(moment(dateToUse), moment(season.closing_date_for_applications));
    }

    userEquals(user1, user2) {
        return (user1.id != undefined && user2.id != undefined && user1.id == user2.id) || user1.first_name === user2.first_name &&
            user1.last_name === user2.last_name &&
            user1.birthday === user2.birthday;
    }

    onChangeIdentificationNumber(user, identification_number) {
        this.setState({
            infos: {
                ...this.state.infos,
                identification_number: this.userEquals(user, this.state.infos) ? identification_number : this.state.infos.identification_number,
                family_links_with_user: this.state.infos.family_links_with_user.map(u => {
                    if (this.userEquals(u, user)) {
                        u.identification_number = identification_number;
                    }
                    return u;
                })
            }
        })
    }

    render() {

        if (!this.isApplicationAuthorized(this.state.season_id))
        {
            return <Fragment>
                <div
                    className={`m-t m-b-sm h-auto img-rounded p-sm text-dark ${this.state.user.is_admin ? "bg-warning" : "bg-danger"}`}>
                    Les inscriptions à la saison actuelle est fermée et celles de la saison suivante ne sont pas encore
                    ouvertes.
                </div>

                {this.state.user.is_admin ?
                    <a className="btn btn-primary" href={"/seasons/new"}>Créer une saison</a> : ""}
            </Fragment>
        }

        const activitiesThatRequirePreferencesSelection = this.props.allActivityRefs
            .filter(ref => ref.allows_timeslot_selection)
            .map(ref => ref.id);

        const allSelectedActivities = [
            ...this.state.selectedActivities,
            ...Object.values(this.state.selectedFormulaActivities || {}).flat()
        ];

        const preferencesActivities = _.intersection(
            activitiesThatRequirePreferencesSelection,
            allSelectedActivities
        );

        const timePrefsMode = preferencesActivities.length > 0
            ? preferencesActivities.length < allSelectedActivities.length ? PLANNING_AND_PREFERENCES_MODE : PREFERENCES_MODE
            : PLANNING_MODE;


        const formulaActivitiesIds = Object.values(this.state.selectedFormulaActivities || {}).flat();
        const refsToEvaluate = this.state.activityRefs.filter(
            ref => ref.is_evaluable &&
                (this.state.selectedActivities.includes(ref.id) || formulaActivitiesIds.includes(ref.id)) &&
                !_.find(this.state.learnedActivities, aId => aId === ref.id)
        );

        // Clear out previous season's handicap description value
        const userFormInitialValues = {...this.state.infos, handicap_description: ""};

        const activityChoiceActionTypes = [PRE_APPLICATION_ACTIONS.PURSUE_CHILDHOOD, PRE_APPLICATION_ACTIONS.NEW, PRE_APPLICATION_ACTIONS.RENEW];

        const steps = [
            !this.props.preApplicationActivity && this.props.preSelectedUser && (this.props.preSelectedUser.id === this.props.user.id) && {
                name: "Membre Concerné",
                component: (
                    this.props.currentUserIsAdmin ? <UserSearch
                            user={this.props.user}
                            onSelect={this.handleSelectUser.bind(this)}
                            season={this.state.season}
                        /> :
                        <WizardUserSelectMember
                            user={this.props.user}
                            onSelect={this.handleSelectUser.bind(this)}
                            season={this.state.season}
                        />
                ),
            },
            {
                name: "Coordonnées",
                component: (

                    <UserForm
                        schoolName={this.props.schoolName}
                        user={this.props.user}
                        shouldCheckGdpr={!this.props.currentUserIsAdmin}
                        hidePayers={true}
                        initialValues={userFormInitialValues}
                        displayIdentificationNumber={this.props.countryCode==="BE"}
                        onSubmit={values => this.handleUserFormSubmit(values)}
                        documentUrl={this.props.documentUrl}
                        consent_docs={this.props.consent_docs}
                    />
                ),
            },
            this.props.actionType === PRE_APPLICATION_ACTIONS.CHANGE &&
            this.state.isApplicationChange && {
                name: "Voeux de changement",
                component: (
                    <ApplicationChangeQuestionnaire
                        referenceData={this.props.referenceData}
                        questions={this.props.application_change_questions}
                        answers={this.state.applicationChangeAnswers}
                        onChange={answers =>
                            this.handleApplicationChangeAnswersChange(
                                answers
                            )
                        }
                    />
                ),
            },

            !this.state.skipFormulaChoice && {
                name: "Choix de la formule",
                component: (
                    <WrappedFormulaChoice
                        schoolName={this.props.schoolName}
                        formulaPrices={this.props.formula_prices}
                        season={this.state.season}
                        selectedFormulas={this.state.selectedFormulas}
                        selectedFormulaActivities={this.state.selectedFormulaActivities}
                        formulas={this.props.formulas}
                        currentUserIsAdmin={this.props.currentUserIsAdmin}
                        handleAddFormula={id => this.handleAddFormula(id)}
                        handleRemoveFormula={id => this.handleRemoveFormula(id)}
                        handleUpdateFormulaActivities={(id, activities) => this.handleUpdateFormulaActivities(id, activities)}
                        validation={null}
                        infoText={this.props.formulaChoiceDisplayText}
                        selectedActivities={this.state.selectedActivities}
                        allActivityRefs={this.props.allActivityRefs}
                    />
                ),
            },

            !this.state.skipActivityChoice &&
            activityChoiceActionTypes.includes(this.props.actionType) && {
                name: "Choix de l'activité",
                component: (
                    <WrappedActivityChoice
                        schoolName={this.props.schoolName}
                        adhesionPrices={this.props.adhesion_prices}
                        adhesionEnabled={this.props.adhesion_enabled}
                        infos={this.state.infos}
                        season={this.state.season}
                        selectedActivities={this.state.selectedActivities}
                        activityRefs={this.state.activityRefs}
                        activityRefsChildhood={this.state.activityRefsChildhood}
                        activityRefsCham={this.props.activityRefsCham}
                        allActivityRefs={this.props.allActivityRefs}
                        allActivityRefKinds={this.props.allActivityRefKinds}
                        currentUserIsAdmin={this.props.currentUserIsAdmin}
                        packs={this.props.packs}
                        handleSelectActivities={id =>
                            this.handleSelectActivities(id)
                        }
                        handleAddActivity={id => this.handleAddActivity(id)}
                        handleRemoveActivity={id =>
                            this.handleRemoveActivity(id)
                        }
                        handleAddPack={(key, id) => this.handleAddPack(key, id)}
                        handleRemovePack={(key, id) => this.handleRemovePack(key, id)}
                        selectedFormulas={this.state.selectedFormulas}
                        selectedPacks={this.state.selectedPacks}
                        validation={null}
                        infoText={this.props.activityChoiceDisplayText}
                    />
                ),
            },
            this.props.allActivityRefs.find(ar => ar.is_work_group && (this.state.selectedActivities.includes(ar.id) || Object.values(this.state.selectedFormulaActivities || {}).flat().includes(ar.id))) !== undefined && {
                name: "Instruments",
                component: (
                    <div>
                        <label>Instruments que vous souhaitez pratiquer dans l'activité</label>
                        <Select
                            defaultValue={_.map(this.state.infos.instruments, ({id: value, label}) => ({label, value}))}
                            options={this.props.instruments.map(i => ({label: i.label, value: i.id}))}
                            onChange={values => this.handleUpdateInstruments(values.map(v => v.value))}
                            isMulti/>
                    </div>
                )
            },
            //this.props.actionType !== PRE_APPLICATION_ACTIONS.RENEW &&
            (this.state.selectedActivities.length > 0 ||
                Object.values(this.state.selectedFormulaActivities || {}).flat().length > 0) && {
                name: "Disponibilités",
                component: (
                    <TimePreferencesStep
                        selectionLabels={this.getLabelsFromSelectedActivities()}
                        mode={timePrefsMode}
                        onAvailabilityAdd={intervals =>
                            this.handleAddAvailability(intervals)
                        }
                        onAvailabilityDelete={intervals =>
                            this.handleDeleteAvailability(intervals)
                        }
                        planningId={this.state.infos.planning.id}
                        intervals={this.state.intervals}
                        season={this.state.season}
                        seasons={this.props.seasons}
                        handleUpdateIntervalsSelection={ints =>
                            this.handleChangeIntervals(ints)
                        }
                        childhoodPreferences={this.state.childhoodPreferences}
                        activityRefs={preferencesActivities.map(id =>
                            this.props.allActivityRefs.find(
                                ref => ref.id === id
                            )
                        )}
                        authToken={this.state.infos.authentication_token}
                        handleUpdateChildhoodPreferences={prefs =>
                            this.handleUpdateChildhoodPreferences(prefs)
                        }
                    />
                ),
            },

            this.props.actionType === PRE_APPLICATION_ACTIONS.NEW &&
            refsToEvaluate.length && {
                name: "Évaluation de niveau",
                component: (
                    <Evaluation
                        questions={this.props.new_student_level_questions}
                        answers={this.state.levelQuestionnaireAnswers}
                        refsToEvaluate={refsToEvaluate}
                        onChange={answers =>
                            this.handleLevelAnswersChange(answers)
                        }
                    />
                ),
            },
            this.props.actionType === PRE_APPLICATION_ACTIONS.NEW &&
            this.state.practicedInstruments.length && {
                name: "Créneaux d'évaluation",
                component: (
                    <EvaluationIntervalChoice
                        handleUpdateSelectedEvaluationIntervals={interval =>
                            this.handleUpdateSelectedEvaluationIntervals(
                                interval
                            )
                        }
                        activityRefs={this.props.allActivityRefs}
                        selectedEvaluationIntervals={
                            this.state.selectedEvaluationIntervals
                        }
                        season={this.state.season}
                    />
                ),
            },

            (this.props.availPaymentScheduleOptions && this.props.availPaymentScheduleOptions.length > 0 || this.props.paymentStepDisplayText) && {
                name: "Paiement",
                component: (
                    <WrappedPayerPaymentTerms
                        informationalStepOnly={false}
                        user={{id: this.state.infos.id, first_name: this.state.infos.first_name, last_name: this.state.infos.last_name, is_paying: this.state.infos.is_paying, identification_number: this.state.infos.identification_number, birthday: this.state.infos.birthday }}
                        family={this.state.infos.family_links_with_user}
                        initialSelectedPayers={this.state.infos.payers || []}
                        paymentTerms={(this.state.infos.payer_payment_terms || []).find(pt => pt.season_id === this.state.season.id) || {}}
                        collection={(this.state.infos.payer_payment_terms || []).find(pt => pt.season_id === this.state.season.id) || {}}
                        availPaymentScheduleOptions={this.state.availPaymentScheduleOptions}
                        availPaymentMethods={this.state.availPaymentMethods}
                        paymentStepDisplayText={this.props.paymentStepDisplayText}
                        onChangePaymentTerms={this.handleChangePaymentTerms.bind(this)}
                        onChangeDayForCollection={this.handleChangeDayForCollection.bind(this)}
                        onChangePaymentMethod={this.handleChangePaymentMethod.bind(this)}
                        onChangePayers={this.handleChangePayers.bind(this)}
                        displayIdentificationNumber={this.props.countryCode==="BE"}
                        onChangeIdentificationNumber={this.onChangeIdentificationNumber.bind(this)}
                    />
                )
            },

            {
                name: "Résumé",
                component: (
                    <Validation
                        levels={this.props.levels}
                        application={this.state}
                        buttonDisabled={this.state.buttonDisabled}
                        teachers={this.props.teachers}
                        activityRefs={this.props.activityRefs}
                        activityRefsChildhood={this.props.activityRefsChildhood}
                        allActivityRefs={this.props.allActivityRefs}
                        allActivityRefKinds={this.props.allActivityRefKinds}
                        lastAdherentNumber={this.props.last_adherent_number}
                        handleSubmit={() => this.handleSubmit()}
                        handleSetParameter={null}
                        handleComment={(text) => this.handleComment(text)}
                        additionalStudents={this.state.additionalStudents}
                        errors={this.state.errors}
                        selectedPacks={this.state.selectedPacks}
                        packs={this.props.packs}
                        paymentTerms={(this.state.infos.payer_payment_terms || [])}
                        availPaymentScheduleOptions={this.state.availPaymentScheduleOptions}
                        availPaymentMethods={this.state.availPaymentMethods}
                        selectedFormulas={this.state.selectedFormulas}
                        selectedFormulaActivities={this.state.selectedFormulaActivities}
                        formulas={this.props.formulas}
                    />
                ),
            },
        ].filter(e => e);

        return (
            <div className="padding-page application-form" style={{ width: "85%" }}>
                <div className="d-md-inline-flex justify-content-between w-100">


                </div>
                <div style={{
                    marginBottom: "35px",
                    marginTop: "45px",
                }}>
                    <h1 style={{ color: "#00334A" }}>Nouvelle demande d’inscription</h1>
                    <h3 style={{ color: "#8AA4B1" }}>Demande d'inscription
                        {!this.state.skipActivityChoice && activityChoiceActionTypes.includes(this.props.actionType) ?
                            " aux activités"
                            : " à l'activité " + this.props.allActivityRefs.find(ar => ar.id === this.state.selectedActivities[0]).display_name
                        } pour la {this.state.season.label}
                    </h3>
                    {this.props.currentUserIsAdmin ? (
                        <div className="flex flex-justified m-t-md m-b-sm">
                            <div className="form-group">
                                <select
                                    className="custom-select h-100"
                                    value={this.state.season.id}
                                    onChange={e =>
                                        this.handleChangeSeason(
                                            parseInt(e.target.value)
                                        )
                                    }
                                >
                                    {_.map(this.props.seasons, s => (
                                        <option key={s.id} value={s.id}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group flex flex-center-aligned m-l ml-5">
                                <label
                                    className="m-r-sm my-auto"
                                    style={{ width: "100%" }}
                                >
                                    Date de début
                                </label>
                                <input
                                    type="date"
                                    className="w-150 form-control"
                                    style={{ border: "none", borderRadius: "8px" }}
                                    min={moment(
                                        findAndGet(
                                            this.props.seasons,
                                            s =>
                                                parseInt(
                                                    this.state.season.id
                                                ) === s.id,
                                            "start"
                                        )
                                    ).format(ISO_DATE_FORMAT)}
                                    max={moment(
                                        findAndGet(
                                            this.props.seasons,
                                            s =>
                                                parseInt(
                                                    this.state.season.id
                                                ) === s.id,
                                            "end"
                                        )
                                    ).format(ISO_DATE_FORMAT)}
                                    onChange={e =>
                                        this.handleChangeBeginAt(e.target.value)
                                    }
                                    value={this.state.begin_at || ""}
                                />
                            </div>
                        </div>
                    ) : null}
                </div>
                <div className="step-progress" style={{ marginBottom: "75px" }}>
                    <div className="wizard-steps-container" style={{ overflowX: "auto" }}>
                        <StepZilla
                            steps={steps}
                            showSteps={true}
                            stepsNavigation={true}
                            nextButtonText={"Suivant"}
                            backButtonText={"Précédent"}
                            nextButtonCls={
                                "btn btn-prev btn-primary btn-md pull-right font-weight-bold"
                            }
                            backButtonCls={
                                "btn btn-prev btn-primary btn-md pull-left font-weight-bold"
                            }
                            onStepChange={(step) => {
                                window.scrollTo({ top: 0, behavior: "instant" });
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default Wizard;
