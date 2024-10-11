import React from "react";
import swal from 'sweetalert2';


export default class SwalBackEndModal extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            isLaunched: false
        };
    }

    render()
    {
        if(!this.state.isLaunched)
        {
            new Promise(() => swal(this.props.swal_props));

            this.state.isLaunched = false;
        }

        return null;
    }

    show()
    {
        this.setState({isLaunched: false});
    }
}