import React from "react";
import { Form, Field } from 'react-final-form';
import * as api from "../../../tools/api";
import Swal from 'sweetalert2'
import { csrfToken } from "../../utils";

const initialEmail = "pas@dadresse.détectée"

class New extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount(){
        this.setState({
            email : initialEmail,
            })
    }

    onSubmit = (values, form) => {
        let redirect_path = "/u/sign_in"

        api.set()
            .success((res)=> console.log(res))
            .error((res) => console.log(res))
            .post(
            "/u/password",
            {
                utf8: true,
                user: {...values},
                password: null,
                "X-CSRF-Token": csrfToken,
            },
        )

        let title = '<h5>Bonjour <b>'+values.first_name+' '+values.last_name+'</b></h5>';
        let htmltext = '<p>'+
                            'Un email va vous être envoyé sur l\'adresse '+'<br/>'
                            +'<b>'+this.state.email+'</b>'+'<br/>'
                            +'Vous allez être redirigé vers la page de connexion'
                        +'</p>'
        let confirmtext= 'Redirection'
        Swal.fire({
            title: title,
            html: htmltext,
            timer: 10000,
            allowOutsideClick: false,
            confirmButtonText: confirmtext,
          }).then((result)=>{
            window.location.href =redirect_path
          })
        return undefined
    }

    async checkValidUser(values){
        let errors = await api.set()
            .success(data=> {
                return Boolean(data.email)
                    ? this.setState({
                        email : data.email,
                        })
                    : {uniqueness: 'Nom - prénom - date de naissance doit correspondre à un utilisateur'}
            })
            .error((errors) => console.log("Erreurs : "+errors))
            .post("/users/exist",{
                first_name: values.first_name,
                last_name: values.last_name,
                birthday: values.birthday,
            })
        errors ? this.setState({
            email : initialEmail,
            })
        : null
        return errors
    }

    validate = (values) => {
        const errors = {}
        if (!values.first_name) {
            errors.first_name = 'Requis'
        }
        if (!values.last_name) {
            errors.last_name = 'Requis'
        }
        if (!values.birthday) {
            errors.birthday = 'Requis'
        } 
        return Object.keys(errors).length ? errors : this.checkValidUser(values)
    }
        
    render () {
        return (
            <Form
                onSubmit={this.onSubmit}
                validate={this.validate}
                render={({
                    errors, 
                    hasValidationErrors,
                    handleSubmit 
                }) => {
                    return (<form onSubmit={handleSubmit} className="m-t" id="new_user">
                        <div className="ibox">
                            <div className="ibox-title">
                                <label>Réinitialisation par Nom - Prénom - Date de Naissance</label>
                            </div>
                            <div className="ibox-content">
                                <Field name="first_name" >
                                    {({ input, meta }) => (
                                        <div className="form-group">
                                            <label>Prénom</label>
                                            <input {...input} type="text" placeholder="votre prénom" className="form-control"/>
                                            {meta.error && meta.touched && <span>{meta.error}</span>}
                                        </div>
                                    )}
                                </Field>
                                <Field name="last_name">
                                    {({ input, meta }) => (
                                        <div className="form-group">
                                            <label>Nom</label>
                                            <input {...input} type="text" placeholder="votre nom" className="form-control"/>
                                            {meta.error && meta.touched && <span>{meta.error}</span>}
                                        </div>
                                    )}
                                </Field>
                                <Field name="birthday">
                                    {({ input, meta }) => (
                                        <div className="form-group">
                                            <label>Date de naissance</label>
                                            <input {...input} type="date" placeholder="jj/mm/aaa" className="form-control"/>
                                            {meta.error && meta.touched && <span>{meta.error}</span>}
                                        </div>
                                    )}
                                </Field>
                                <button type="submit" 
                                    className="btn btn-primary block full-width"
                                    // disabled={hasValidationErrors}
                                >
                                        Envoyer un mail de récupération
                                </button>
                                {errors.uniqueness && <span>{errors.uniqueness}</span>}
                                
                            </div>
                        </div>
                    </form>)
                }}
            />
        )
    }
}

export default New;