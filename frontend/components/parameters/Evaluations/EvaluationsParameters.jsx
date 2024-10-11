import BaseParameters from "../BaseParameters";
import EvaluationLevels from "./EvaluationLevels";
import React,{Component} from "react";
import EvaluationSlot from "./EvaluationSlot"
import { xorBy } from "lodash";
xorBy

export  default class EvaluationsParameters extends BaseParameters
{
    constructor(props)
    {
        super(props);

    

        this.state.tabsNames = ["Niveaux d'évaluation","Créneau d'évaluation"];
        this.state.divObjects = [<EvaluationLevels urlListData="/parameters/evaluations_parameters/list_levels" urlNew="/evaluation_level_ref/new" />, <EvaluationSlot/>];
    }
    
}