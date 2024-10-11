import React from "react";

class ChildSelection extends React.Component {
    constructor(props) {
        super(props);
    }

    renderParentSelection(key) {
        const renderParentsOptions = _.chain(this.props.family)
            .map((parent, id) => {
                return (
                    <option
                        key={id}
                        value={id}
                        selected={this.props.additionalStudents[key][1] == id}
                    >
                        {`${parent.first_name} ${parent.last_name}`}
                    </option>
                );
            })
            .value();

        return (
            <form>
                <label htmlFor="o">{`Elève pour l'Eveil n° ${key + 1}`}</label>
                <select
                    id={key}
                    onChange={e => {
                        return this.props.handleChangeAdditionalStudent(
                            key,
                            e.target.value,
                        );
                    }}
                    className="form-control"
                >
                    <option value={0} selected disabled>
                        Choisir un élève
                    </option>
                    {renderParentsOptions}
                </select>
            </form>
        );
    }

    render() {
        return (
            <div className="ibox float-e-margins">
                <div className="ibox-content">
                    <div className="form form-horizontal ">
                        <h2>
                            Choix des élèves supplémentaires / accompagnants
                        </h2>
                        {_.map(this.props.additionalStudents, (p, i) => (
                            <div key={i}>{this.renderParentSelection(i)}</div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
}

export default ChildSelection;
