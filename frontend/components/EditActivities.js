import React from "react";
import Select from "react-select";
import { csrfToken } from "./utils";

class EditActivities extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            values: props.values,
        };
    }

    updateActivities() {
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            .getAttribute("content");

        fetch(this.props.ajaxUrl, {
            method: "PATCH",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: this.props.modelId,
                activities: this.state.values.map(v => v.value),
            }),
        }).then(() => (window.location = this.props.redirectUrl));
    }

    handleChange(values) {
        this.setState({
            values,
        });
    }

    render() {
        return (
            <div>
                <div className="form-group">
                    <Select
                        value={this.state.values}
                        options={this.props.options}
                        onChange={e => this.handleChange(e)}
                        isMulti={true}
                        isSearchable={true}
                        isClearable={true}
                        closeMenuOnSelect={false}
                    />
                </div>
                <input
                    type="submit"
                    value="Mettre à jour"
                    className="btn btn-primary block full-width m-b"
                    onClick={() => this.updateActivities()}
                />
            </div>
        );
    }
}

export default EditActivities;
