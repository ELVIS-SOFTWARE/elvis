import React from "react";
import * as api from "../../../tools/api";
import swal from "sweetalert2";
import {throttle} from 'lodash';
import JobProgress from "../../JobProgress";
import ReactDOM from 'react-dom';

export default class ReplicateWeekAct extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            refWeekDate: [],
            startDate: '',
            endDate: '',
            replicateOnVac: undefined,
            jobSubmitted: false,
            jobId: null
        };

        this.handleChangeDate = this.handleChangeDate.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.throttledSubmit = throttle(this.handleSubmit, 1000); // Limiter à 1 clic par seconde
    }

     showJobProgressModal(jobId) {
        const container = document.createElement('div');
        ReactDOM.render(<JobProgress jobId={jobId} onError={(res) => swal({ title: "Erreur", text: res, type: "error" })} />, container);

        swal.fire({
            title: 'Suivi de la réplication',
            html: container,
            showCloseButton: true,
            focusConfirm: false,
            confirmButtonText: 'OK',
        });
    }

    render() {
        const { replicationMaxDelay = 14 } = this.props;
        const {refWeekDate, startDate, endDate, jobSubmitted, jobId} = this.state;
        const maxEndDate = startDate ?
            new Date(new Date(startDate).getTime() + (replicationMaxDelay * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
            : ''

        return <div className="row">
            <div className="col-md-12">
                <div className="row flex flex-end-aligned my-3">
                    <div className="col-sm-4">
                        <div>
                            <label htmlFor="refWeekDate">
                                Semaine à utiliser comme modèle pour la réplication<span
                                className="text-danger"> *</span> (sélectionnez une date quelconque de la semaine)
                            </label>
                            <input
                                className="form-control"
                                type="date"
                                name="refWeekDate"
                                id="refWeekDate"
                                onChange={this.handleChangeDate}
                                disabled={this.state.jobSubmitted}
                            />
                        </div>
                    </div>
                </div>

                <div className="row flex flex-end-aligned my-3">
                    <div className="col-sm-4">
                        <label htmlFor="targetStartDate">
                            Date de début de réplication<span className="text-danger"> *</span>
                        </label>
                        <input
                            className="form-control"
                            type="date"
                            name="startDate"
                            id="targetStartDate"
                            onChange={this.handleChangeDate}
                            disabled={this.state.jobSubmitted}
                        />
                    </div>
                    <div className="col-sm-4">
                        <label htmlFor="targetEndDate">
                            Date de fin de réplication<span className="text-danger"> *</span>
                        </label>
                        <input
                            className="form-control"
                            type="date"
                            name="endDate"
                            id="targetEndDate"
                            min={startDate}
                            max={maxEndDate}
                            value={endDate}
                            onChange={this.handleChangeDate}
                            disabled={jobSubmitted}
                        />
                    </div>
                </div>


                <div className="row flex flex-end-aligned my-3">
                    <div className="col-sm-4">
                        <input type="checkbox" name="rov" id="rov" defaultChecked={false}
                               onChange={({target}) => this.setState({replicateOnVac: target["checked"]})}
                               disabled={jobSubmitted}/>
                        <label htmlFor="rov">Répliquer sur les vacances</label>
                    </div>

                </div>


                {refWeekDate && startDate && endDate ?
                    <button className="btn btn-success" onClick={this.throttledSubmit}
                            disabled={jobSubmitted}>Valider</button>
                    : ""
                }
            </div>
        </div>
    }

    handleChangeDate(event) {
        const {name, value} = event.target;
        let isValidDate = !isNaN((new Date(value)).getTime());

        if (name === 'startDate') {
            this.setState({
                startDate: isValidDate ? value : '',
                endDate: ''
            });
        } else {
            this.setState({
                [name]: isValidDate ? value : ''
            });
        }
    }


    handleSubmit() {
        this.setState({jobSubmitted: true});

        api.set()
            .success(res => {
                this.setState({
                    refWeekDate: [],
                    startDate: undefined,
                    endDate: undefined,
                    replicateOnVac: undefined,
                    jobId: res.jobId
                });

                this.showJobProgressModal(res.jobId);

            })
            .error(res => swal({title: "Erreur", text: res, type: "error"}))
            .post("/scripts/replicate_week_activities/execute", {
                refWeekDate: this.state.refWeekDate,
                targetStartDate: this.state.startDate,
                targetEndDate: this.state.endDate,
                rov: this.state.replicateOnVac
            })
    }
}