import React from "react";
import {csrfToken} from "./utils";

export default class OnRestart extends React.Component
{
    constructor(props)
    {
        super(props);

        this.executeFetch = this.executeFetch.bind(this);
    }

    componentDidMount()
    {
        setTimeout(() => this.executeFetch(), 3000);
    }

    executeFetch()
    {
        try {
            fetch(window.location.href, {
                headers: {
                    "X-Csrf-Token": csrfToken
                }
            }).then(res =>
            {
                if(res.ok)
                    setTimeout(() => window.location.reload(), 5000)
                else
                    setTimeout(() => this.executeFetch(), 1000);
            });
        }
        catch (e)
        {
            this.executeFetch();
        }
    }

    render()
    {
        return '';
    }
}