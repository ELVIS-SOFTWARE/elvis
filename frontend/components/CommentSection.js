import React, { Fragment } from "react";

const moment = require("moment");
require("moment/locale/fr");

import _ from "lodash";

import ButtonModal from "./common/ButtonModal";

class CommentSection extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            newComment: "",
            editedComment: null,
            comments: this.props.comments,
        };
    }

    render() {
        return (
            <div>
                <div className="ibox">
                    <div className="ibox-title">
                        <h4>
                            Commentaires
                            <ButtonModal
                                modalProps={{style: {content: {position: "static"}}}}
                                className="btn btn-xs btn-primary pull-right"
                                label={<Fragment><i className="fas fa-plus m-r-sm" /> Ajouter un commentaire</Fragment>}>
                                {
                                    ({closeModal}) =>
                                        <div>
                                            <div className="modal-header">
                                                <p>Ajouter un Commentaire</p>
                                            </div>
                                            <div className="modal-body">
                                                <input
                                                    type="textarea"
                                                    className="form-control"
                                                    value={this.props.newComment}
                                                    onChange={e => this.props.handleUpdateNewCommentContent(e)} />
                                            </div>
                                            <div className="modal-footer flex flex-space-between-justified">
                                                <button className="btn" style={{marginRight: "auto"}} type="button" onClick={closeModal}>
                                                    <i className="fas fa-times m-r-sm"></i>
                                                    Annuler
                                                </button>
                                                <button
                                                    className="btn btn-primary pull-right"
                                                    onClick={() => {this.props.handleSaveComment(); closeModal();}}>
                                                    <i className="fas fa-save m-r-sm"></i>
                                                    Sauvegarder
                                                </button>
                                            </div>
                                        </div>
                                }
                            </ButtonModal>
                        </h4>
                    </div>{
                        this.props.contextType && this.props.contextId ? 
                        <div className="ibox-content">
                        {_.chain(this.props.comments)
                            .orderBy(c => c.created_at)
                            .reverse()
                            .map((c, i) => (
                                <div className="row" key={i}>
                                    <div className="col-lg-11">
                                        <p>
                                            {c.content} <br />
                                            <i>
                                                <small>
                                                    par {_.get(c, "user.first_name") || "utilisateur"}{" "}
                                                    {_.get(c, "user.last_name") || "inconnu"} le{" "}
                                                    {moment(
                                                        c.created_at,
                                                    ).format(
                                                        "DD MMMM YYYY, à hh:mm",
                                                    )}
                                                    {c.created_at ==
                                                    c.updated_at ? null : (
                                                        <span>
                                                            <br />
                                                            Modifié le{" "}
                                                            {moment(c.updated_at).format("DD MMMM YYYY, à hh:mm")}
                                                        </span>
                                                    )}
                                                </small>
                                            </i>
                                        </p>
                                        <hr />
                                    </div>
                                    <div className="col-lg-1">
                                        {this.props.userId == c.user_id ? (
                                            <ButtonModal
                                                onClick={() => this.props.handleCommentEdition(c.id)}
                                                modalProps={{style: {content: {position: "static"}}}}
                                                className="btn btn-xs btn-primary pull-right"
                                                label={<i className="fas  fa-edit" />}>
                                                {
                                                    ({closeModal}) => <div className="modal-content animated">
                                                        <div className="modal-header">
                                                            <p>Editer un Commentaire</p>
                                                        </div>
                                                        <div className="modal-body">
                                                            <input
                                                                type="textarea"
                                                                className="form-control"
                                                                value={
                                                                    this.props.editedComment
                                                                        ? this.props.editedComment.content
                                                                        : ""
                                                                }
                                                                onChange={e => this.props.handleUpdateEditedCommentContent(e)}
                                                            />
                                                        </div>
                                                        <div className="modal-footer flex flex-space-between-justified">
                                                            <button
                                                                className="btn"
                                                                style={{marginRight: "auto"}}
                                                                onClick={closeModal}
                                                                type="button">
                                                                <i className="fas fa-times m-r-sm"></i>
                                                                Annuler
                                                            </button>
                                                            <button
                                                                className="btn btn-primary pull-right"
                                                                onClick={() => {this.props.handleSaveCommentEdition(); closeModal();}}>
                                                                <i className="fas fa-save m-r-sm"></i>
                                                                Sauvegarder
                                                            </button>
                                                        </div>
                                                    </div>
                                                }
                                            </ButtonModal>
                                        ) : null}
                                    </div>
                                </div>
                            ))
                            .value()}
                    </div>
                        : <div className="ibox-content">
                            Un échéancier doit être créé pour laisser des commentaires.
                        </div>
                    }
                </div>
            </div>
        );
    }
}

export default CommentSection;
