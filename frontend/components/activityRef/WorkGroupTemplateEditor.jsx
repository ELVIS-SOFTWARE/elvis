import React from "react";
import _ from "lodash";
import { Field, FormSpy } from "react-final-form";
import Checkbox from "../common/Checkbox";

export default class WorkGroupEditor2 extends React.Component {
    constructor(props) {
        super(props);

        // Values FORMAT : { [instrumentId (int)] : count (int) }
        const values = _(props.activityInstruments)
            .groupBy("id")
            .mapValues(_.size)
            .value();

        this.state = {
            values,
        };
    }

    componentDidMount() {
        if (this.props.onChange) {
            this.props.onChange(this.state);
        }
    }

    componentDidUpdate() {
        if (this.props.onChange) {
            this.props.onChange(this.state);
        }
    }

    handleUpdateInstrumentCount(instrumentId, diff) {
        let newValues = { ...this.state.values };
        let newVal = (newValues[instrumentId] || 0) + diff;

        newValues[instrumentId] = newVal;

        // Remove instrument from values if count is null
        if (newVal <= 0) newValues = _.omit(newValues, instrumentId);

        this.setState({ values: newValues });
    }

    /*
    handleSave() {
        const { activityRefId } = this.props;
        const { values } = this.state;

        this.setState({ loading: true });

        api.set()
            .success(() => this.setState({ loading: false }))
            .patch(`/activity_refs/${activityRefId}/instruments`, {
                instruments: values,
            });
    }
*/

    renderInstruments() {
        const { values } = this.state;
        const { instruments } = this.props;

        if (instruments.length == 0) {
            return <p className="text-center">Aucun instrument sauvegardé. Vous pouvez en créer en suivant ce <a href="/instruments/new" >lien</a>.</p>;
        }
        else {
            return (
                <div>

                    <h2>Modèle de groupe</h2>


                    <div className="row">
                        <div
                            className="col-lg-6"
                            style={{ borderRight: "solid 1px #eaeaea" }}
                        >
                            <h4>Instruments</h4>
                            {instruments.map(i => (
                                <div
                                    key={i.id}
                                    className="flex flex-space-between-justified m-b instrument-selector"
                                >
                                    <h4>{i.label}</h4>&nbsp;
                                    <button type="button"
                                        onClick={() =>
                                            this.handleUpdateInstrumentCount(
                                                i.id,
                                                +1
                                            )
                                        }
                                        className="btn btn-sm btn-outline btn-primary"
                                    >
                                        <i className="fas fa-plus"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="col-lg-6">
                            <h4>Rôles</h4>
                            {Object.entries(values).map(([instrumentId, count]) => {
                                const instrument = instruments.find(
                                    i => i.id === parseInt(instrumentId)
                                );

                                return (
                                    <div
                                        key={instrumentId}
                                        className="flex flex-space-between-justified m-b instrument-selector"
                                    >
                                        <h4>
                                            {instrument.label}{" "}
                                            <strong>x{count}</strong>
                                        </h4>
                                        &nbsp;
                                        <button type="button"
                                            onClick={() =>
                                                this.handleUpdateInstrumentCount(
                                                    instrumentId,
                                                    -1
                                                )
                                            }
                                            className="btn btn-sm btn-outline btn-primary"
                                        >
                                            <i className="fas fa-minus"></i>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            );
        }
    }

    render() {

        const { loading } = this.state;
        return (
            <div className="work-group-model-editor m-t">

                <div className="row">
                    <div className="col-lg-6">
                        <Field
                            id="is_work_group"
                            label="Ce cours est un atelier"
                            name="activityRef.is_work_group"
                            type="checkbox"
                            render={Checkbox}
                        />
                    </div>
                </div>

                <FormSpy subscription={{ values: true }}>
                    {
                        ({ values: { activityRef: { is_work_group } } }) => (
                            is_work_group && this.renderInstruments()
                        )
                    }
                </FormSpy>

            </div>
        );
    }
}
