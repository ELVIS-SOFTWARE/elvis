import BaseParameters from "../BaseParameters";
import Localisations from "./Localisations";
import React from "react";
import swal from "sweetalert2";
import {csrfToken} from "../../utils";

export default class RoomsParameters extends BaseParameters
{
    constructor(props)
    {
        super(props);

        this.state.tabsNames = ["Liste des sites"];
        this.state.divObjects = [<Localisations
            urlListData="/parameters/rooms_parameters/list"
            urlNew="/locations/new" 
            rooms={props.rooms}/>]
    }
}