import React from "react";
import PropTypes from "prop-types";
import _ from "lodash";

const moment = require("moment");
require("moment/locale/fr");

class StudentModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = { kind: this.props.kind || "c" };
    }

    handleOptionChange(e) {
        this.setState({ kind: e.target.value });
    }

    handleSave() {
        this.props.onSave({ ...this.state });
    }

    handleRemove() {
        this.props.onRemove();
    }

    renderKindOption() {
        return (
            <form>
                <div className="checkbox-custom">
                    <label for="c">
                        <input
                            id="c"
                            type="radio"
                            value="c"
                            checked={this.state.kind == "c"}
                            onChange={e => this.handleOptionChange(e)}
                        />
                        <span>Cours</span>
                    </label>
                </div>
                <div className="checkbox-custom">
                    <label for="o">
                        <input
                            id="o"
                            type="radio"
                            value="o"
                            checked={this.state.kind == "o"}
                            onChange={e => this.handleOptionChange(e)}
                        />
                        <span>Option</span>
                    </label>
                </div>
            </form>
        );
    }

    render() {
        return (
            <div>
                <h4>Selection</h4>
                {this.renderKindOption()}
                <button onClick={() => this.handleSave()}>Enregistrer</button>
            </div>
        );
    }
}

export default StudentModal;
