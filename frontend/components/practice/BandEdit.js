import React from "react";
import BandForm from "./BandForm";

import * as api from "../../tools/api";
import {redirectTo} from "../../tools/url";
import {infosFromBand} from "../../tools/obj";

export default class BandEdit extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isOtherGenre: false,
            addMember: false,
            previousValues: {},
            infos: infosFromBand(this.props.band)
        };
    }

    handleSubmit(values) {
        api.set()
            .success(() => redirectTo(`/parameters/practice_parameters`))
            .patch(`/practice/bands/${this.props.band.id}`, values);
    }


    render() {
        const { band, musicGenres, bandTypes, instruments, season } = this.props;
        const { isOtherGenre, addMember } = this.state;

        return (
            <React.Fragment>
                <div className="row wrapper border-bottom white-bg page-heading">
                    <h2>
                        Edition du groupe : <b>{this.props.band.name}</b>
                    </h2>
                </div>

                <div className="m-t-lg">
                    <ul className="nav nav-tabs">
                        <li className="active">
                            <a
                                data-toggle="tab"
                                href="#tab-1"
                                className="nav-link active show"
                            >
                                Informations
                            </a>
                        </li>
                        <li>
                            <a
                                data-toggle="tab"
                                href="#tab-2"
                                className="nav-link"
                            >
                                Réservations
                            </a>
                        </li>
                    </ul>

                    {/* Content */}
                    <div className="tab-content p-md border-bottom border-left-right border-danger">
                        <div id="tab-1" className="tab-pane active">
                        <BandForm                             
                                initialValues={this.state.infos}
                                musicGenres={musicGenres}
                                bandTypes={bandTypes}
                                instruments={instruments}
                                season={season}
                                displaySubmit
                                submitting={this.state.isFetching}
                                onSubmit={this.handleSubmit.bind(this)}
                            />
                        </div>

                        <div id="tab-2" className="tab-pane">
                            
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}