import React from "react";
import {csrfToken} from "../utils";
import Select from "react-select";

export default class ActivityRefTeachers extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            teachers: props.teachers,
            all_teachers: []
        }
    }

    componentDidMount()
    {
        fetch("/teachers/index", {
            method: "get",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Accept": "application/json"
            }
        })
            .then(res => res.json())
            .then(json =>
            {
                this.setState({ all_teachers: json.map(t => ({ id: t.id, last_name: t.last_name, first_name: t.first_name})) });
            });
    }

    render()
    {
        return <div>
            <Select
                isMulti
                name="teachers"
                options={this.state.all_teachers}
                getOptionLabel={option => `${option.last_name} ${option.first_name}`}
                getOptionValue={option => option.id}
                value={this.state.teachers}
                onChange={teachers => {
                    if(this.props.onChange && typeof this.props.onChange === "function")
                        this.props.onChange(teachers);

                    this.setState({ teachers });
                }}
            />
        </div>
    }
}