import React, { Fragment } from "react";

export default class EditGroupNameInput extends React.PureComponent {
    constructor(props) {
        super(props);

        this.debounce = null;

        this.state = { value: this.props.value || "" };
    }

    handleInputChange(value) {
        if (this.debounce) {
            clearTimeout(this.debounce);
        }

        this.debounce = setTimeout(() => {
            this.props.onChange(value);
            this.debounce = null;
        }, 400);

        this.setState({ value });
    }

    render() {
        return (
            <Fragment>
                <div className="input-group m-b-md">
                    <span className="input-group-addon">
                    {"Nom du groupe"}
                    </span>
                    <input
                        className="form-control"
                        type="text"
                        value={this.state.value}
                        onChange={(e) => this.handleInputChange(e.target.value)}
                        name="groupName"
                    />
                    <span className="input-group-btn">
                        <button className="btn btn-primary" onClick={this.props.onSave}>
                            {"Enregistrer"}
                        </button>
                    </span>
                </div>
    
                <p className="alert alert-info">
                    {"Changer le nom du groupe pour cette instance le modifiera pour toutes les occurences de cette activité."}
                </p>
            </Fragment>
        );
    }
}