import React from "react";
import _ from "lodash";

import * as ActiveStorage from "activestorage";
import Dropzone from "react-dropzone";
import { csrfToken } from "./utils";

class AvatarUpload extends React.Component {
    constructor(props) {
        super(props);

        this.onDrop = this.onDrop.bind(this);
    }

    onDrop(acceptedFiles, rejectedFiles) {
        let formPayLoad = new FormData();

        if(acceptedFiles.length)
            formPayLoad.append("avatar", _.head(acceptedFiles));

        fetch(`/users/${this.props.userId}/upload_avatar`, {
            method: "post",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                // "Content-Type": "application/form-data",
                pragma: "no-cache",
            },
            body: formPayLoad,
        }).then(() => {
            window.location.reload();
        });
    }

    render() {
        return (
            <Dropzone onDrop={this.onDrop}
                      disablePreview={true}
                      multiple={false}
                      accept="image/*"
                      >
                {({getRootProps, getInputProps}) => (
                    <section style={{
                        border: "none",
                        cursor: "pointer",
                        top: -93,
                        left: 5,
                        position: "relative"
                    }}>
                        <div {...getRootProps()}>
                            <i
                                className="fas fa-pencil-alt"
                                style={{ color: "#d63031", fontSize: 20 }}
                            />
                            <input {...getInputProps()} />

                        </div>
                    </section>
                )}
            </Dropzone>
        );
    }
}

export default AvatarUpload;
