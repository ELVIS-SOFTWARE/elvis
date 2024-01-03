import React from "react";
import MergeUsers from "../../scripts/mergeUsers/MergeUsers";
import BaseParameters from "../BaseParameters";

export default class CommunityParameters extends BaseParameters
{
    constructor(props)
    {
        super(props);

        this.state.tabsNames = ["Fusion d'utilisateurs"];
        this.state.divObjects = [<MergeUsers season={this.props.season} />];
    }
}