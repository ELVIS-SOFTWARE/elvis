import React, { Fragment } from "react";
import {csrfToken} from "../utils";
import Select from "react-select";
import { Field } from "react-final-form";
import { MESSAGES } from "../../tools/constants";
import { required } from "../../tools/validators";
import SelectMultiple from "../common/SelectMultiple";

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
            {this.state.all_teachers.length > 0 && <SelectMultiple
                title="Professeurs"
                name="teachers"
                isMulti
                all_features={this.state.all_teachers.map(t => [`${t.last_name} ${t.first_name}`, t.id])}
                features={this.state.teachers}
                mutators={this.props.mutators}
            />}


        </div>
    }
}