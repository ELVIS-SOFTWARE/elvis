import React from "react";
import Input from "../../common/Input";
import { isEmpty } from "../../../tools/validators";
import { fullname, toDate, toLocaleDate } from "../../../tools/format";
import * as api from "../../../tools/api";
import _ from "lodash";

let debounce = null;

class UserSearch extends React.PureComponent {
    constructor(props) {
        super(props);

        const tmp = () => { };

        this.state = {
            last_name: "",
            first_name: "",
            possibleMatches: [],
            selectedUser: null,
            idx: -1,
            firstSelectedId: -1,
            resetSelection: this.props.resetSelection || tmp
        };

        this.handleChange = this.handleChange.bind(this);
    }

    handleUserSelect(i) {
        const { possibleMatches } = this.state;

        const selectedUser = possibleMatches[i];

        this.props.onSelect(selectedUser);

        let sid = this.state.firstSelectedId === -1 ? i : this.state.firstSelectedId;

        if (!this.props.saveFirstSelect)
            sid = -1;

        this.setState({
            selectedUser,
            idx: i,
            firstSelectedId: sid
        });
    }

    handleChange(evt) {
        this.setState({ [evt.target.name]: evt.target.value, firstSelectedId: -1 });
        this.state.resetSelection();

        if (debounce) {
            clearTimeout(debounce);
        }

        if ( this.state.first_name.length >= 2 || this.state.last_name.length >= 2){
            debounce = setTimeout(() => {
                api.set()
                    .before(() => this.setState({ selectedUser: null, idx: -1 }))
                    .success(data => this.setState({ possibleMatches: data }))
                    .error(() => this.setState({ possibleMatches: [] }))
                    .post(
                        "/users/search_for_admin",
                        {
                            first_name: this.state.first_name,
                            last_name: this.state.last_name,
                            season_id: this.props.season.id,
                        }
                    );

                debounce = null;
            }, 400);
        }
    }

    render() {
        const { last_name, first_name, possibleMatches, idx } = this.state;

        return (
            <div className="ibox">
                <div className="ibox-title">
                    <h3>{"Chercher des utilisateurs"}</h3>
                </div>

                <div className="ibox-content">
                    <div className="row">
                        <div className="col-sm-6">
                            <Input
                                label="Nom"
                                input={{
                                    type: "text",
                                    name: "last_name",
                                    onChange: this.handleChange,
                                    value: last_name,
                                }}
                                meta={{}}
                            />
                        </div>

                        <div className="col-sm-6">
                            <Input
                                label="Prénom"
                                input={{
                                    type: "text",
                                    name: "first_name",
                                    onChange: this.handleChange,
                                    value: first_name,
                                }}
                                meta={{}}
                            />
                        </div>
                    </div>

                    {possibleMatches.length > 0 ? (
                        <div>
                            <h4>{"Résultats"}</h4>
                            <div className="list-group">
                                {_.map(possibleMatches, (m, i) => {
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            className={`list-group-item ${i === this.state.firstSelectedId ? "btn-danger active" : i === idx ? "active" : ""}`}
                                            onClick={() => this.handleUserSelect(i)}>
                                            <b>{fullname(m)}</b>({m.id})
                                            {` né(e) le ${toLocaleDate(
                                                toDate(m.birthday)
                                            )}, Adhérent #${m.adherent_number}`}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null}

                    {this.state.firstSelectedId > -1 ? <div className="text-right">
                        <button type="button" className="btn btn-warning" onClick={() => {
                            this.state.resetSelection();

                            this.setState({ firstSelectedId: -1, idx: -1 });
                        }}>Reset</button>
                    </div> : ""}
                </div>
            </div>
        );
    }
}

export default UserSearch;
