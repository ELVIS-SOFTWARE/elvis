import React from "react";
import Swal from 'sweetalert2';
import * as api from "../../tools/api.js";
import { csrfToken } from "../utils";

export default class AddPreAppFromStopApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fetching: true,
            exist: true,
        }
    }
    
    componentDidMount() {
        this.fetchExist();
    }

    fetchExist() {
        let {user, current_user, next_season, activity} = this.props;
        this.setState({
            ...this.state,
            fetching: true,
        })
        api.set()
            .success((res) => {
                this.setState({
                    ...this.state,
                    fetching: false,
                    exist: res,
                })
            })
            .post(
                `/pre_application_activities/exist?auth_token=${csrfToken}`,
                { 
                    user_id: user.id, 
                    current_user_id: current_user.id,
                    activity_id: activity.id,
                    season_id: next_season.id,
                }
            );
    }

    createPreApp() {
        let {user, current_user, next_season, activity} = this.props;
        api.set()
            .success((res) => {
                document.location.reload()
            })
            .patch(
                `/pre_application_activities/create_from_activity?auth_token=${csrfToken}`,
                { 
                    user_id: user.id, 
                    current_user_id: current_user.id,
                    activity_id: activity.id,
                    season_id: next_season.id,
                }
            );
    }
    
    onClick(res) {
        const {user, next_season} = this.props;
        let title = '<h5>Cette action permet à <b>'+user.first_name+' '+user.last_name+'</b> de se préinscrire à l \'activité pour la <b>'+next_season.label+'</b></h5>';
        let htmltext = '';
        let confirmtext= 'Confirmer';
        let cancelText= 'Annuler';
        Swal.fire({
            title: title,
            html: htmltext,
            allowOutsideClick: false,
            confirmButtonText: confirmtext,
            showCancelButton: true,
            cancelButtonText: cancelText,
          }).then((result)=>{
            if (result.value) {this.createPreApp()};
          })
    }

    render() {
        let { fetching, exist} = this.state;
        let disabled = fetching || exist;  
        return <button
            onClick={(res) => this.onClick(res)}
            disabled = {disabled}
            title = {disabled ? "Cette action a déjà été effectuée" : ""}
            className="btn btn-warning m-l-sm">
            Ouvrir la PréInscription
        </button>
    }
}