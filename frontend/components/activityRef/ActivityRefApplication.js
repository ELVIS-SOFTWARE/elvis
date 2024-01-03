import React from "react";
import { Field } from "react-final-form";

import Checkbox from "../common/Checkbox";

export default class ActivityRefApplication extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tabs: []
        }
    }

    onSubmit() {
        alert("on submit");
    }

    render() {
        return (
            <div>
                <hr />

                <div className="row-sm">
                    <h3>Réinscription</h3>
                    <label>Activités proposées lors d'une réinscription (si aucune sélection, toutes les activités seront proposées)
                        <br />
                        <Field

                            component="select"
                            multiple size="10"
                            name="nextCycles"
                            style={{ width: '50%' }}>

                            {this.props.activityRefs.map((kind) => {
                                return <optgroup key={kind[0].id} label={kind[0].name}>
                                    {kind[1].map((actRef) => {
                                        return <option key={actRef.id} value={actRef.id}>{actRef.label}</option>
                                    })}
                                </optgroup>
                            })}
                        </Field>
                    </label>
                </div>

                <p className="row-sm text-muted">
                    Sélectionner plusieurs activités avec <strong>CTRL</strong>.<br />
                    Sélectionner la totalité entre deux activités avec <strong>MAJ/SHIFT</strong>.<br />
                    Vous pouvez combiner <strong>CTRL</strong> et <strong>MAJ/SHIFT</strong>.
                </p>

                <div className="row-sm">
                    <h3>Visibilité</h3>
                    <Field
                        id="is_lesson"
                        label="Ce cours peut être selectionné lors d'une inscription"
                        name="applicationOptions"
                        value="is_lesson"
                        type="checkbox"
                        render={Checkbox}
                    />
                    <Field
                        id="is_visible_to_admin"
                        label="Ce cours peut être selectionné lors d'une inscription, uniquement par les permanents"
                        name="applicationOptions"
                        value="is_visible_to_admin"
                        type="checkbox"
                        render={Checkbox}
                    />
                    <Field
                        id="is_unpopular"
                        label="Ce cours est peu demandé, il risque de ne pas ouvrir dans une saison"
                        name="applicationOptions"
                        value="is_unpopular"
                        type="checkbox"
                        render={Checkbox}
                    />
                </div>


                <div className="row-sm">
                    <h3>Choix des cours</h3>
                    <Field
                        id="allows_timeslot_selection"
                        label="Proposer des créneaux de cours aux élèves"
                        name="applicationOptions"
                        value="allows_timeslot_selection"
                        type="checkbox"
                        render={Checkbox}
                    />
                </div>


                <div className="row-sm">
                    <h3>Evaluation</h3>
                    <Field
                        id="is_evaluable"
                        label="Ce cours nécessite une évaluation pour les nouveaux élèves"
                        name="applicationOptions"
                        value="is_evaluable"
                        type="checkbox"
                        render={Checkbox}
                    />
                </div>


            </div>
        );
    }
}