import React from "react";
import { USER_OPTIONS, optionMapper, displayInlineAddress, csrfToken } from "../utils";

const testId = id => id || id === 0;

class Address extends React.Component {
    constructor(props) {
        super(props);

        this.debouncedUpdateSuggestions = _.debounce(
            this.updateSuggestions,
            500
        );

        this.state = {
            suggestions: [],
        };
    }

    handleFieldChange(e) {
        let address = { ...this.props.address };
        address[e.target.name] = e.target.value;

        if (this.props.user.id !== 0 && e.target.name === "street_address")
            this.debouncedUpdateSuggestions(e.target.value);

        this.props.setAddress(address.id, address.isNew, address, true);
    }

    updateSuggestions(val) {
        fetch(`/addresses/search?query=${val}&user_id=${this.props.user.id}`, {
            method: "GET",
            headers: {
                "X-CSRF-Token": csrfToken,
            },
        })
            .then(res => res.json())    
            .then(res => this.setState({ suggestions: res }));
    }

    suggestionSelected(addressId) {
        let suggestion = this.state.suggestions.find(
            s => s.address_id === addressId,
        );

        this.props.setAddress(
            this.props.address.id,
            this.props.address.isNew,
            suggestion.address,
            false,
        );
    }

    render() {
        const family = _.get(this.props.user, "family");

        const { identicalAddress } = this.props;

        function handleIdenticalAddressCheck(e) {
            if(e.target.checked)
                this.props.handleSetIdenticalAddress(this.props.address.id, null, null);
            else
                this.props.handleUnsetIdenticalAddress(this.props.address.id);
        }

        return (
            <div className="m-b-sm">
                <div className="flex flex-center-aligned">
                    {
                        family.length ?
                        <div className="flex flex-fill flex-center-aligned m-b-sm p-xs b-r-md m-b-sm">
                            <input
                                type="checkbox"
                                checked={!!identicalAddress}
                                onChange={handleIdenticalAddressCheck.bind(this)}/>
                            <span
                                className="m-l-sm m-r"
                                style={{textDecoration: identicalAddress ? "none" : "line-through"}}>Identique à</span>
                            {
                                identicalAddress ?
                                <select
                                    style={{width: "min-content"}}
                                    className="form-control"
                                    onChange={e => {
                                        const u = _.find(family, u => u.id == e.target.value);
                                        
                                        if(u)
                                            this.props.handleSetIdenticalAddress(this.props.address.id, u.id);
                                    }}
                                    value={identicalAddress.userId}>
                                    <option value=""></option>
                                    {_(family).map(optionMapper(USER_OPTIONS)).value()}
                                </select>
                                : null
                            }
                            {
                                identicalAddress && testId(identicalAddress.userId) ?
                                <select
                                    style={{width: "min-content"}}
                                    className="form-control"
                                    onChange={e => this.props.handleSetIdenticalAddress(this.props.address.id, identicalAddress.userId, e.target.value)}
                                    value={identicalAddress.addressId || ""}>
                                    <option value=""></option>
                                    {_.map(_.get(_.find(family, u => u.id == identicalAddress.userId), "addresses"),
                                        optionMapper({label: (a, i) => `Adresse ${i+1} : ${displayInlineAddress(a)}`}))}
                                </select> : null
                            }
                        </div> : null
                        
                    }
                </div>

                <div className="row form-group">
                    <label className="col-md-2 col-sm-2">
                        Voie
                    </label>
                    <div className="col-md-4 col-sm-3">
                        <input
                            type="text"
                            className="form-control"
                            name="street_address"
                            value={this.props.address.street_address || ""}
                            onChange={e => this.handleFieldChange(e)}
                        />
                    </div>

                    <label className="col-md-2 col-sm-2">
                        Code Postal
                    </label>
                    <div className="col-md-4 col-sm-2">
                        <input
                            type="text"
                            className="form-control"
                            name="postcode"
                            value={this.props.address.postcode || ""}
                            onChange={e => this.handleFieldChange(e)}
                        />
                    </div>
                </div>
                {this.state.suggestions.length > 0 ? (
                    <div className="row form-group">
                        <div className="alert alert-warning col-md-12">
                            <p>Adresses déjà existantes :</p>
                            {this.state.suggestions.map(s => (
                                <p
                                    key={"" + s.user_id + s.address_id}
                                    onClick={() =>
                                        this.suggestionSelected(s.address_id)
                                    }
                                    style={{
                                        cursor: "pointer",
                                    }}
                                >
                                    <b>
                                        {`${s.user.first_name} ${
                                            s.user.last_name
                                        }`}
                                    </b>
                                    {" : "}
                                    {s.address.street_address}
                                </p>
                            ))}
                        </div>
                    </div>
                ) : null}

                <div className="row form-group">
                    <label className="col-md-2 col-sm-1">
                        Ville
                    </label>
                    <div className="col-md-4 col-sm-3">
                        <input
                            type="text"
                            className="form-control"
                            name="city"
                            value={this.props.address.city || ""}
                            onChange={e => this.handleFieldChange(e)}
                        />
                    </div>

                    <label className="col-md-2 col-sm-1">
                        Département
                    </label>
                    <div className="col-md-4 col-sm-3">
                        <input
                            type="text"
                            className="form-control"
                            name="department"
                            value={this.props.address.department || ""}
                            onChange={e => this.handleFieldChange(e)}
                        />
                    </div>
                </div>

                <button
                    className="btn btn-warning btn-sm"
                    onClick={() =>
                        this.props.removeAddress(this.props.address)
                    }
                >
                    <i className="fas fa-trash" />
                    Supprimer
                </button>
            </div>
        );
    }
}

export default Address;
