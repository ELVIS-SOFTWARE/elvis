import React, {useState} from 'react';

import _ from "lodash";
import CreatableSelect from "react-select/lib/Creatable";
import SelectMultiple from "../../common/SelectMultiple";

class RepetWithFeature_Fom extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            isRepet: this.props.isRepet,
            features: this.props.features
        };
    }

    render()
    {
        return <div>
            <div className="form-group">
                <label>Salle de répétition ?</label><br/>
                <div className="onoffswitch">
                    <input className="onoffswitch-checkbox" type="checkbox" name="room[is_practice_room]" id="is_practice_room" value={!!this.state.isRepet} checked={this.state.isRepet} onChange={() => {
                        this.setState({isRepet: !this.state.isRepet});

                        if(!this.state.isRepet)
                            this.state.features = [];
                    }
                    } />
                    <label className="onoffswitch-label" htmlFor='is_practice_room'>
                        <span className="onoffswitch-inner"/>
                        <span className="onoffswitch-switch"/>
                    </label>
                </div>
            </div>
            { this.state.isRepet && this.props.all_features !== undefined && this.props.all_features.length > 0 ? <div className="form-group">
                <SelectMultiple all_features={this.props.all_features} features={this.state.features} name="features" title="Features" />
            </div> : "" }
        </div>
    }
}

export default RepetWithFeature_Fom;