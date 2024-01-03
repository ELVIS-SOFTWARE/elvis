import React, { Fragment } from "react";
import * as api from "../../tools/api";
import ErrorList from "../common/ErrorList";
import { toTimeRange, fullnameWithAge, fullname } from "../../tools/format";
import QuestionnaireModal from "../common/FormDisplayModal";
import { getAnswersObject } from "../evaluation/Evaluation";
import { toast } from "react-toastify";
import EvaluationForm from "../evaluation/EvaluationForm";

const ListItemContent = ({label, value}) => <React.Fragment>
    <span className="font-bold">{label}</span>
    {" : "}
    {value}
</React.Fragment>

const ListItem = ({ ...content }) => (
    <li className="list-group-item">
        <ListItemContent {...content} />
    </li>
);

const ListItemWithControl = ({control, ...content}) => (
    <li className="list-group-item flex flex-space-between-justified flex-center-aligned">
        <div><ListItemContent {...content} /></div>
        <div>{control}</div>
    </li>
);

const sortByStudentName = (a, b) => {
    const lastnameA = a.student.last_name.toUpperCase();
    const lastnameB = b.student.last_name.toUpperCase();

    if (lastnameA < lastnameB) {
        return -1;
    }

    if (lastnameA > lastnameB) {
        return 1;
    }

    return 0;
};

const renderStudentOptions = appointments =>
    appointments.map((app, i) => (
        <option key={i + 1} value={app.id}>
            {fullnameWithAge(app.student)}. Pour {app.activity_ref.kind}
        </option>
    ));

class EvaluationModal extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            errors: [],
            appointments: [],
            appointment: null,
            isFetching: false,
        };

        this.toggleFetching = this.toggleFetching.bind(this);
        this.setAppointments = this.setAppointments.bind(this);
        this.setErrors = this.setErrors.bind(this);
    }

    componentDidMount() {
        api.set()
            .success(this.setAppointments)
            .error(this.setErrors)
            .get(`/evaluation_appointments/without_interval`);
    }

    fetchQuestionnaire() {
        const {
            schedule,
            seasons,
        } = this.props;

        const {
            student_id: userId,
            activity_ref_id: activityRefId,
        } = schedule.evaluation_appointment;

        // Take season closest to 
        const seasonId = _.get(
            _(seasons)
                .sortBy(s => Math.abs(Date.parse(schedule.start) - Date.parse(s.start)))
                .head(),
            "id"
        );

        api.set()
            .before(
                () => this.setState({
                    loadingQuestionnaire: true,
                })
            )
            .success(
                ({
                    new_student_level_questionnaire: questionnaire,
                    reference_data: referenceData
                }) => this.setState({
                    loading: false,
                    questionnaire,
                    referenceData,
                    loadingQuestionnaire: false,
                })
            )
            .error(toast.error)
            .get(`/new_student_level_questionnaire?user_id=${userId}&activity_ref_id=${activityRefId}&season_id=${seasonId}`);
    }

    toggleFetching() {
        this.setState({ isFetching: !this.state.isFetching });
    }

    setErrors(errors) {
        this.setState({ errors, isFetching: false });
    }

    setAppointments(data) {
        this.setState({
            appointments: data.sort(sortByStudentName),
            isFetching: false,
        });
    }

    handleChange(e) {
        this.setState({
            appointment: this.state.appointments.find(
                app => app.id === parseInt(e.target.value)
            ),
        });
    }

    handleSave() {
        const { appointment } = this.state;
        const { schedule, onSave } = this.props;

        if (appointment) {
            api.set()
                .before(this.toggleFetching)
                .success(() => (onSave ? onSave() : undefined))
                .error(this.setErrors)
                .patch(`/evaluation_appointments/${appointment.id}`, {
                    time_interval_id: schedule.id,
                });
        }
    }

    handleDelete() {
        if (window.confirm("Voulez-vous vraiment supprimer ce créneau ?")) {
            const { schedule, onDelete } = this.props;

            api.set()
                .before(this.toggleFetching)
                .success(() => (onDelete ? onDelete(schedule.id) : undefined))
                .error(this.setErrors)
                .del(`/time_intervals/${schedule.id}`);
        }
    }

    render() {
        const {
            errors,
            appointments,
            isFetching,
            isModalOpen,
            loadingQuestionnaire,
            questionnaire,
            referenceData,
        } = this.state;

        const { schedule, newStudentLevelQuestions } = this.props;

        if (!schedule) {
            return null;
        }

        return (
            <div>
                <ErrorList errors={errors} />

                {schedule.is_validated && schedule.evaluation_appointment ? (
                    <ul className="list-group">
                        <ListItem
                            label="Horaire"
                            value={toTimeRange(schedule)}
                        />
                        <ListItem
                            label="Professeur"
                            value={fullname(
                                schedule.evaluation_appointment.teacher
                            )}
                        />
                        <ListItem
                            label="Activité"
                            value={schedule.evaluation_appointment.activity_ref.kind} />
                        {
                            schedule.evaluation_appointment.student ?
                                <Fragment>
                                    <ListItemWithControl
                                        label="Elève"
                                        value={fullnameWithAge(
                                            schedule.evaluation_appointment.student
                                        )}
                                        control={
                                            <button className="btn btn-xs btn-primary"
                                                onClick={() => this.fetchQuestionnaire()}>
                                                <i className="fas fa-file m-r-xs"></i>
                                                Lire auto-évaluation
                                            </button>
                                        } />
                                    {questionnaire &&
                                        <li className="list-group-item">
                                            <span className="font-bold">Auto-évaluation :</span>
                                            <EvaluationForm
                                                readOnly
                                                className="p"
                                                questions={newStudentLevelQuestions}
                                                referenceData={referenceData}
                                                answers={getAnswersObject(questionnaire.answers)} />
                                        </li>}
                                </Fragment> :
                                <ListItem
                                    label="Élève"
                                    value={<strong>AUCUN</strong>} />
                        }
                    </ul>
                ) : (
                    <h3>Veuillez aller sur la page <strong>Gestion des évaluations</strong> pour valider des créneaux d'évaluation.</h3>
                )}

                <div className="clearfix">
                    <button
                        className="m-l-sm btn btn-warning pull-right"
                        disabled={isFetching}
                        onClick={() => this.handleDelete()}
                    >
                        {"Supprimer"}
                    </button>
                </div>
            </div>
        );
    }
}

export default EvaluationModal;
