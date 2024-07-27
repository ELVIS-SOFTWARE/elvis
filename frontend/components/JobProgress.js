import React from "react";
import * as api from "../tools/api";
import swal from "sweetalert2";
import ProgressBar from "@ramonak/react-progress-bar";

class JobProgress extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            progressValue: 0,
            progressText: ""
        };
        this.trackProgress = this.trackProgress.bind(this);
    }

    componentDidMount() {
        this.trackProgress(this.props.jobId);
    }

    componentWillUnmount() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
    }

    trackProgress(jobId) {
        api.set()
            .success(({ jobStatus }) => {
                this.setState({
                    progressValue: Math.round(jobStatus.progress / jobStatus.total * 100),
                    progressText: jobStatus.step,
                    status: jobStatus.status,
                    errors: jobStatus.errors || [],
                });
                if (jobStatus.status !== "completed" && jobStatus.status !== "failed") {
                    this.timeout = setTimeout(() => this.trackProgress(jobId), 1000);
                }
            })
            .error(res => {
                swal({ title: "Erreur", text: res, type: "error" });
                if (this.props.onError) {
                    this.props.onError(res);
                }
            })
            .get(`/jobs/${jobId}/status`, {});
    }

    render() {
        const { status, progressValue, progressText, errors } = this.state;
        const statusText = status==="working" ?
            "En cours" :
            status==="completed" ?
                "Terminé" :
                "Echec";

        return (
            <div>
                <ProgressBar completed={progressValue} />
                <p>{statusText} - {progressText}</p>
                {(errors || []).length > 0 && (
                    <details>
                        <summary style={{ color: "inherit",  cursor: "pointer" }}>&#9654; {errors.length===1 ? "1 erreur..." :  `${errors.length} erreurs...`}</summary>
                        <ul>
                            {errors.map((error, index) => (
                                <li key={index}>Ligne: {error.line}, Message: {error.message}</li>
                            ))}
                        </ul>
                    </details>
                )}

            </div>
        );
    }
}

export default JobProgress;