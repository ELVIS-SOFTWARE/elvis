import React from "react";

class ErrorList extends React.PureComponent {
    constructor(props) {
        super(props);
    }

    render() {
        const { errors } = this.props;

        if (!errors || !errors.length) {
            return null;
        }

        return (
            <div className="alert alert-danger m-t-sm m-b-sm">
                <ul>
                    {errors.map((err, i) => (
                        <li key={i}>{err}</li>
                    ))}
                </ul>
            </div>
        );
    }
}

export default ErrorList;