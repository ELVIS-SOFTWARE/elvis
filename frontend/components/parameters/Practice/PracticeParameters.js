import BaseParameters from "../BaseParameters";
import React from "react";
import Groups from "./Groups";
import BandsType from "./BandsType";
import MusicGenres from "./MusicGenres";
import Materials from "./Materials";
import FlatRate from "./FlatRate";
import Features from "./Features";
import Instruments from "./Instruments";

export default class PracticeParameters extends BaseParameters
{
    constructor(props)
    {
        super(props);

        this.state.tabsNames = ["Type de groupes", "Genre musical", "Gestion des groupes", "Matériels", "Forfaits", "Option des salles", "Instruments"];
        this.state.divObjects = [
            <BandsType
                urlListData="/parameters/practice_parameters/list_band_types"
                urlNew="/practice/band_types/new"
            />,
            <MusicGenres
                urlListData="/parameters/practice_parameters/list_music_genres"
                urlNew="/practice/music_genres/new"
            />,
            <Groups
                urlListData="/parameters/practice_parameters/list_bands"
                urlNew="/practice/bands/new" />,
            <Materials
                urlListData="/parameters/practice_parameters/list_materials"
                urlNew="/practice/materials/new" />,
            <FlatRate
                urlListData="/parameters/practice_parameters/list_flat_rates"
                urlNew="/practice/flat_rates/new" />,
            <Features
                urlListData="/parameters/practice_parameters/list_features"
                urlNew="/practice/room_features/new"/>,
            <Instruments
                urlListData="/parameters/practice_parameters/list_instruments"
                urlNew="/instruments/new" />]
    }
}