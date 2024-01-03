import React from "react";
import _ from "lodash";

import Dropzone from "react-dropzone";

class ActivityRefImageUpload extends React.Component {
    constructor(props) {
        super(props);

        this.onDrop = this.onDrop.bind(this);
    }

    onDrop(acceptedFiles, rejectedFiles) {
        let formPayLoad = new FormData();

        if (acceptedFiles.length)
            formPayLoad.append("avatar", _.head(acceptedFiles));

        console.log(`j'envoie le fichier ${acceptedFiles}`)
        // fetch(`/users/${this.props.userId}/upload_avatar`, {
        //     method: "post",
        //     credentials: "same-origin",
        //     headers: {
        //         "X-CSRF-Token": csrfToken,
        //         // "Content-Type": "application/form-data",
        //         pragma: "no-cache",
        //     },
        //     body: formPayLoad,
        // }).then(() => {
        //     window.location.reload();
        // });
    }

    render() {
        return (
            <Dropzone onDrop={this.onDrop}
                disablePreview={true}
                multiple={false}
                accept="image/*"
            >
                {({ getRootProps, getInputProps }) => (
                    <section style={{
                        cursor: "pointer"
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

export default ActivityRefImageUpload;
