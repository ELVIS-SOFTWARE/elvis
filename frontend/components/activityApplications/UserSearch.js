import React from "react";
import Input from "../common/Input";
import {
    isEmpty,
    required,
    isValidAge,
    composeValidators,
} from "../../tools/validators";
import {
    fullname,
    toDate,
    toLocaleDate,
    toBirthday,
    toAge,
} from "../../tools/format";
import * as api from "../../tools/api";
import { toast } from "react-toastify";
import { MESSAGES } from "../../tools/constants";
import NewStudentForm from "../userForm/NewStudentForm";
import Modal from "react-modal";
import swal from "sweetalert2";

class UserSearch extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            last_name: "",
            first_name: "",
            possibleMatches: [],
            selectedUser: null,
            idx: -1,
            usernotSearched: true,
            isModalOpen: false,
        };

        this.onSubmit = this.onSubmit.bind(this);
        this.toggleModal = this.toggleModal.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    isValidated() {
        if (this.state.selectedUser === null) {
            toast.error(MESSAGES.err_must_select_user, { autoClose: 3000 });
            return false;
        }

        this.props.onSelect(this.state.selectedUser);

        return true;
    }

    handleUserSelect(i) {
        const { possibleMatches } = this.state;

        const selectedUser = possibleMatches[i];

        if (this.props.noValidation) this.props.onSelect(selectedUser);

        this.setState({
            selectedUser,
            idx: i,
        });
    }

    handleChange(evt) {
        this.setState({ [evt.target.name]: evt.target.value });

        let first_name, last_name;
        if(evt.target.name=="first_name") {
            first_name = evt.target.value || '';
            last_name = this.state.last_name || '';
        } else {
            first_name = this.state.first_name || '';
            last_name = evt.target.value || '';
        }


        if (debounce) {
            clearTimeout(debounce);
        }

        if ( first_name.length >= 3 ||
             last_name.length >= 3
        ) {
            debounce = setTimeout(() => {
                api.set()
                    .before(() =>
                        this.setState({ selectedUser: null, idx: -1 })
                    )
                    .success(data =>
                        this.setState({
                            possibleMatches: data,
                            usernotSearched: false,
                        })
                    )
                    .error(() => this.setState({ possibleMatches: [] }))
                    .post(
                        !this.props.user.is_admin
                            ? "/users/search"
                            : "/users/search_for_admin",
                        {
                            first_name: this.state.first_name,
                            last_name: this.state.last_name,
                            season_id: this.props.season.id,
                        }
                    );

                debounce = null;
            }, 400);
        }
    }

    toggleModal() {
        this.setState({ isModalOpen: !this.state.isModalOpen });
    }

    onSubmit(values) {
        let newUser = {
            first_name: values.first_name,
            last_name: values.last_name,
            email: values.email,
            birthday: values.birthday,
            sex: values.sex
        };

        api.set()
            .success(res => {
                swal({
                    type: "success",
                    title: "Enregistrement effectué",
                }).then(() => {
                    this.toggleModal();
                    api.set()
                        .success(data => {
                            this.setState({
                                possibleMatches: data,
                                usernotSearched: false,
                            });
                            this.handleUserSelect(0)
                        })
                        .error(() => this.setState({ possibleMatches: [] }))
                        .post(
                            !this.props.user.is_admin
                                ? "/users/search"
                                : "/users/search_for_admin",
                            {
                                first_name: this.state.first_name,
                                last_name: this.state.last_name,
                                season_id: this.props.season.id,
                            }
                        )
                });
            })
            .error(msg => {
                console.log("error creating user : ", msg);
                let errorMessage = msg.errors && msg.errors.base && msg.errors.base.length > 0 ? msg.errors.base[0] : msg;
                swal({
                    type: "error",
                    title: errorMessage,
                });
            })
            .post("/users/createStudent", { user: newUser, confirm: values.confirm });
    }

    

    render() {
        const {
            last_name,
            first_name,
            possibleMatches,
            idx,
            usernotSearched,
            isModalOpen,
        } = this.state;

        // if (!this.props.user || !this.props.user.is_admin) {
        //     return null;
        // }

        return (
            <div className="application-form" style={{margin: 0}}>
                <div>
                    <h3 style={{color: "#8AA4B1"}}>{"Chercher un utilisateur"}</h3>
                </div>

                <div>
                    <div className="row">
                        <div className="col-sm-6">
                            <Input
                                label="Nom"
                                input={{
                                    type: "text",
                                    name: "last_name",
                                    onChange: this.handleChange,
                                    value: last_name,
                                }}
                                meta={{}}
                            />
                        </div>

                        <div className="col-sm-6">
                            <Input
                                label="Prénom"
                                input={{
                                    type: "text",
                                    name: "first_name",
                                    onChange: this.handleChange,
                                    value: first_name,
                                }}
                                meta={{}}
                            />
                        </div>
                    </div>

                    {possibleMatches.length > 0 ? (
                        <div>
                            <h4>{"Résultats"}</h4>
                            <div className="list-group">
                                {_.map(possibleMatches, (m, i) => {
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            className={`list-group-item ${
                                                i === idx ? "active" : ""
                                            }`}
                                            onClick={() =>
                                                this.handleUserSelect(i)
                                            }
                                        >
                                            <b>{fullname(m)}</b>
                                            {` né(e) le ${toLocaleDate(
                                                toDate(m.birthday)
                                            )}, Adhérent #${m.adherent_number}`}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        !usernotSearched && (
                            <div className="row">
                                <div className="alert alert-warning m-b-sm">
                                    <strong>
                                        Aucun profil existant retrouvé selon ces
                                        coordonnées.
                                    </strong>
                                    <br />
                                    Si l'utilisateur est déjà enregistré,
                                    vérifiez que les bonnes coordonnées soient
                                    saisies.
                                    <br />
                                    Sinon <em>créez un nouveau profil</em>.
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-primary pull-right"
                                    onClick={() => this.toggleModal()}
                                >
                                    Créer un nouveau profil
                                </button>
                            </div>
                        )
                    )}

                    {
                        <Modal
                            isOpen={isModalOpen}
                            ariaHideApp={false}
                            contentLabel="Ajouter un contact"
                            onRequestClose={this.toggleModal}
                            style={{
                                content: {
                                    top: "5%",
                                    left: "25%",
                                    right: "25%",
                                },
                            }}
                        >
                            <NewStudentForm
                                firstName={first_name}
                                lastName={last_name}
                                onSubmit={this.onSubmit}
                                onClose={this.toggleModal}
                            />
                        </Modal>
                    }
                </div>
            </div>
        );
    }
}

export default UserSearch;
