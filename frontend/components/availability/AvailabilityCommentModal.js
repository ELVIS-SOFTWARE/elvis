import React, { PureComponent } from "react";
import Modal from "react-modal";
import _ from "lodash";
import * as api from "../../tools/api";
import { toast } from "react-toastify";

export default class AvailabilityCommentModal extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            commentValue: _.get(props.availability, "comment.content") || "",
        };
    }

    updateCommentValue(commentValue) {
        this.setState({
            commentValue,
        });
    }

    handleSaveComment() {
        const commentId = _.get(this.props.availability, "comment.id");

        const body = {
            comment: {
                content: this.state.commentValue,
                user_id: this.props.user.id,
                commentable_id: this.props.availability.id,
                commentable_type: "TimeInterval",
            },
        };

        const request = api
            .set()
            .success(comment => {
                const newInterval = {
                    ...this.props.availability,
                    comment,
                };

                this.props.onSaved(newInterval);
            })
            .error(toast.error);

        // Update or create comment
        if(commentId){
            request.patch(`/comments/${commentId}`, body);
        }
        else
            request.post("/comments", body);
    }

    handleDeleteComment() {
        const commentId = _.get(this.props.availability, "comment.id");

        api
            .set()
            .success(() => this.props.onSaved({...this.props.availability, comment: null}))
            .error(toast.error)
            .del(`/comments/${commentId}`);
    }

    render() {
        const commentExists = _.has(this.props.availability, "comment.id");

        return <Modal
            isOpen
            ariaHideApp={false}
            className="col-xs-12 col-lg-3 flex-column"
            onRequestClose={this.props.onClose}>
            <h3>Commentaire</h3>
            <textarea
                className="form-control"
                placeholder="Vous pouvez renseigner quelques précisions ici..."
                onChange={e => this.updateCommentValue(e.target.value)}
                value={this.state.commentValue}>
            </textarea>
            <div className="flex flex-space-between-justified m-t">
                <button
                    className="btn"
                    style={{marginRight: "auto"}}
                    type="button"
                    onClick={this.props.onClose}>
                    <i className="fas fa-times m-r-sm"></i>
                    Annuler
                </button>
                <div>
                    {
                        commentExists &&
                        <button
                            onClick={() => this.handleDeleteComment()}
                            className="btn btn-warning m-r-sm">
                            <i className="fas fa-trash"></i>
                        </button>
                    }
                    <button
                        className="btn btn-primary"
                        onClick={() => this.handleSaveComment()}>
                        <i className="fas fa-save"></i> Enregistrer
                    </button>
                </div>
                
            </div>
        </Modal>;
    }
}
