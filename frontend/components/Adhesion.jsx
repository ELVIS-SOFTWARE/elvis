import React from "react";
import _ from "lodash";
import UserSearch from "./activityApplications/UserSearch";
import { csrfToken } from "./utils";
import moment from "moment";

const NO_USER_SELECTION_STATE = {
    user: null,
    userValidated: false,
    min: undefined
};

class Adhesion extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            ...NO_USER_SELECTION_STATE,
        };
    }

    render() {
        const { user, userValidated } = this.state;

        return <section className="m-t">
            <article>
                <UserSearch
                    user={this.props.currentUser}
                    season={this.props.season}
                    onSelect={user => {
                        const min = user.adhesions
                            .filter(adhesion => adhesion.is_active && adhesion.season_id === this.props.season.id && adhesion.deleted_at === null)
                            .map(adhesion => adhesion.validity_end_date)
                            .sort()
                            .reverse()
                            .at(0)

                        this.setState({user, min, selected: min || moment(this.props.season.end).format("YYYY-MM-DD")})
                    }}
                    noValidation />
                <section className="flex flex-end-justified m-b">
                    <button
                        disabled={!user}
                        className="btn btn-primary pull-right"
                        onClick={() => this.setState({userValidated: true})}>
                        Choisir cet élève
                    </button>
                </section>
            </article>

            {
                user && userValidated && <section className="panel panel-default">
                    <div className="panel-heading">
                        <h3>Adhésion pour {user.first_name} {user.last_name}</h3>
                    </div>
                    <form action="/adhesions" method="POST">
                        <div className="panel-body">
                            <div className="row">
                                <div className="col-sm-6 form-group">
                                    <label>Date de début de validité</label>
                                    <input
                                        type="date"
                                        name="validity_start_date"
                                        className="form-control"
                                        min={this.state.min}
                                        value={this.state.selected}
                                        onChange={e => this.setState({selected: e.target.value})}
                                    />
                                </div>
                            </div>
                            <input type="hidden" name="user_id" value={user.id} />
                            <input type="hidden" name="authenticity_token" value={csrfToken} />
                            <div className="flex flex-end-justified">
                                <button className="btn btn-primary">
                                    <i className="fas fa-save m-r-sm"></i>&nbsp;Enregistrer
                                </button>
                            </div>
                        </div>
                    </form>
                </section>
            }
        </section>;
    }
}

export default Adhesion;