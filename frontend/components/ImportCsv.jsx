import React, { useState } from "react";
import { CSVLink } from "react-csv";
import { csrfToken } from "./utils";
import swal from "sweetalert2";

class ImportCsv extends React.Component {
    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.state = { import_report: null };
    }

    handleSubmit(event) {

        if (event.target.csv_file && event.target.csv_file.files.length > 0) {
            this.setState({ submitting: true });
            event.preventDefault();

            var formData = new FormData();
            formData.append("csv_file", event.target.csv_file.files[0]);

            fetch(`/import_users?auth_token=${csrfToken}`, {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                },
                body: formData,
            }).then(res => {
                this.setState({ submitting: false });

                if (res.ok) {
                    res.json().then(json => {
                        const import_report = json.import_report;
console.log(import_report);
                        if (Object.keys(import_report.errors).length > 0) {
                            this.setState({
                                import_report: json.import_report,
                            });
                        } else {
                            let htmltext =
                                "<p>Toute votre communauté a bien été importée</p>" +
                                "<p>Vous allez être redirigé vers la liste de vos membres";

                            swal.fire({
                                title: "Bravo !",
                                html: htmltext,
                                type: "success",
                                timer: 10000,
                                allowOutsideClick: false,
                            }).then(
                                () =>
                                    (window.location.href = `/users?auth_token=${csrfToken}`)
                            );
                        }
                    });
                }
            }).catch(error => {
                this.setState({ submitting: false });
                console.error(error);
                swal.fire({
                    title: "Erreur",
                    html: "<p>Une erreur est survenue lors de l'import. Veuillez réessayer.</p>",
                    type: "error",
                    timer: 10000,
                });
            })
            ;
        }
    }

    formatData(report) {
        let format = [];
        if (report) {
            Object.keys(report).map(key =>
                format.push({
                    type: key,
                    message: report[key]["message"],
                    lines: this.organizeLines(report[key]["lines"]),
                })
            );
        }

        return format;
    }

    organizeLines(lines) {
        let organized = "";

        for (let i = 0; i < lines.length; i++) {
            organized += lines[i];
            if (i != lines.length - 1) organized += ", ";
        }

        return organized;
    }

    display_row_numbers(lines) {
        switch (lines.length) {
            case 0: return "";
            case 1: return "Ligne " + lines + " : ";
            default: return "Lignes " + lines + " : ";
        }
    }

    render() {
        const content = [
            [
                "Prenom",
                "Nom",
                "Date de naissance",
                "Email",
                "Adresse",
                "Code postal",
                "Ville",
                "Telephone",
                "Role",
            ],
            [
                "John",
                "Doe",
                "25/04/1964",
                "john.doe@gmail.com",
                "18 rue des navets",
                "76600",
                "Le Havre",
                "0625334455",
                "administrateur",
            ],
            [
                "Jane",
                "Doe",
                "25/04/1969",
                "jane.doe@gmail.com",
                "18 rue des navets",
                "76600",
                "Le Havre",
                "0622334455",
                "professeur",
            ],
            [
                "Jack",
                "Doe",
                "25/04/1999",
                "jack.doe@gmail.com",
                "18 rue des navets",
                "76600",
                "Le Havre",
                "0626336455",
                "",
            ],
        ];

        const import_report = this.state.import_report;

        const data =
            import_report && (import_report.errors != null) ? this.formatData(import_report.errors) : [];

        const { submitting } = this.state;

        return (
            <div className="row p-w-xl">
                <div className="row m-b-md">
                    <h4>
                        Pour réaliser votre import voici les étapes à suivre:
                    </h4>
                </div>
                <div className="row m-b-md">
                    <h3>
                        <span
                            className="text-white bg-primary text-center b-r-md m-r-sm"
                            style={{ padding: "3px 8px" }}
                        >
                            1
                        </span>
                        Téléchargez notre fichier CSV type
                    </h3>
                    <br />
                    <p className="m-b-md">
                        Il vous suffira de remplir les différentes colonnes pour
                        importer les données sur Elvis. Le fichier CSV est déjà
                        complété avec des exemples pour comprendre comment bien
                        le remplir. Vous pouvez les supprimer, ce ne sont que
                        des exemples.
                    </p>

                    <CSVLink
                        className="btn btn-primary  m-b-md"
                        filename={"import_users.csv"}
                        data={content}
                        separator={";"}
                        enclosingCharacter={""}
                    >
                        <i className="fas fa-download"></i> Télécharger le
                        fichier CSV type
                    </CSVLink>
                </div>
                <div className="row m-b-md">
                    <h3>
                        <span
                            className="text-white bg-primary text-center b-r-md m-r-sm"
                            style={{ padding: "3px 8px" }}
                        >
                            2
                        </span>
                        Remplissez les cellules de votre fichier CSV
                    </h3>
                    <br />
                    <p>
                        {" "}
                        Ajoutez les personnes que vous souhaitez importer. Avant
                        de commencer, voici la règle d'or:{" "}
                        <span className="font-bold">1 ligne = 1 personne</span>
                    </p>
                    <p>
                        Les champs obligatoires sont:{" "}
                        <span className="font-bold">
                            le nom, le prénom, le mail et la date de naissance
                        </span>
                    </p>
                    <p>
                        Les rôles correspondent au compte professeur ou
                        administrateur. Si vous souhaitez ajouter des
                        professeurs ou des administrateurs, indiquez-le dans la
                        colonne "Role". Les interfaces seront différentes en
                        fonction de ces rôles.
                    </p>
                </div>
                <div className="row m-b-md">
                    <h3>
                        <span
                            className="text-white bg-primary text-center b-r-md m-r-sm"
                            style={{ padding: "3px 8px" }}
                        >
                            3
                        </span>
                        Importez votre fichier CSV
                    </h3>
                    <br />
                    <p>Choisissez le fichier CSV préalablement rempli.</p>

                    <form
                        encType="multipart/form-data"
                        action="/import_users"
                        acceptCharset="UTF-8"
                        data-remote="true"
                        method="post"
                        onSubmit={this.handleSubmit}
                    >
                        <div
                            className="col-lg-5 fileinput fileinput-new input-group m-b-md"
                            data-provides="fileinput"
                        >
                            <div
                                className="form-control"
                                data-trigger="fileinput"
                            >
                                <i className="glyphicon glyphicon-file fileinput-exists"></i>
                                <span className="fileinput-filename"></span>
                            </div>
                            <span className="input-group-addon btn btn-default btn-file">
                                <span className="fileinput-new">
                                    Choisir Fichier
                                </span>
                                <span className="fileinput-exists">
                                    Changer
                                </span>
                                <input
                                    accept="text/csv"
                                    type="file"
                                    name="csv_file"
                                />
                            </span>
                            <a
                                href="#"
                                className="input-group-addon btn btn-default fileinput-exists"
                                data-dismiss="fileinput"
                            >
                                Supprimer
                            </a>
                        </div>
                        <input
                            type="hidden"
                            name="authenticity_token"
                            value={csrfToken}
                        />

                        <div className="form-group">
                            <button
                                className="btn btn-primary btn-md"
                                disabled={submitting}
                            >
                                <i className="fas fa-upload"></i> Importer
                                &nbsp;

                                {submitting && <i className="fas fa-circle-notch fa-spin"/> }
                            </button>
                        </div>
                    </form>
                </div>

                {import_report && import_report.lines_imported>0 && (
                    <div className="row">
                        <div className="alert alert-success">
                            <p>
                                Le fichier a bien été importé ({import_report.lines_imported} {import_report.lines_imported===1 ? "utilisateur" : "utilisateurs"} )
                            </p>
                        </div>
                    </div>
                )}

                {import_report && import_report.errors && (
                    <div className="row">
                        <div className="alert alert-danger">
                            <h4>Attention</h4>
                            {data.map(row => {
                                return (
                                    <p
                                        key={row.lines}
                                    >{`${this.display_row_numbers(row.lines)}${row.message}`}.</p>
                                );
                            })}
                            <hr />
                            <p >Veuillez modifier le fichier et réessayer.</p>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default ImportCsv;
