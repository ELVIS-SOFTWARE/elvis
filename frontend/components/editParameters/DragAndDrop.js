import React, {useCallback, useState} from 'react';
import Dropzone, {DropEvent, FileRejection} from "react-dropzone";
import PropTypes from "prop-types";


const baseStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    borderWidth: 2,
    borderRadius: 2,
    borderColor: '#eeeeee',
    borderStyle: 'dashed',
    backgroundColor: '#fafafa',
    color: 'black',
    fontSize: 15,
    transition: 'border .3s ease-in-out'
};

const previewSize = {
    width: '50px',
    height: '50px'
};

const activeStyle = {
    borderColor: '#2196f3'
};

const acceptStyle = {
    borderColor: '#00e676'
};

const rejectStyle = {
    borderColor: '#ff1744'
};

function DragAndDrop(props) {
    const [file, setFile] = useState(undefined);
    const [url, setUrl] = useState(props.file_url);

    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles.length !== 0) {
            setFile(acceptedFiles[0]);
            setUrl(URL.createObjectURL(acceptedFiles[0]));

            props.setFile(acceptedFiles[0]);

            let reader = new FileReader();

            if (acceptedFiles[0].type.includes("image")) {
                reader.onloadend = function () {
                    let output = document.getElementById('output');
                    output.src = reader.result;
                };
            }

            reader.readAsDataURL(acceptedFiles[0]);
        }
    }, []);

    const isImage = props.acceptedTypes.includes("image");

    function handleDropRejected(fileRejections) {
        let div = document.getElementById("error");
        if (fileRejections[0].errors[0].code === "file-invalid-type") {
            div.classList.remove("d-none");
            div.innerHTML = "Type de fichier non autorisé";
        }

        if (fileRejections[0].errors[0].code === "too-many-files") {
            div.classList.remove("d-none");
            div.innerHTML = "un seul fichier autorisé";
        }
    }

    function removeFile() {
        setFile(undefined);
        props.setFile(undefined);
        setUrl(undefined);

        if (typeof props.onClearedFile === "function")
            props.onClearedFile();
    }

    return file == undefined && url == undefined ?
        <Dropzone onDrop={onDrop} accept={props.acceptedTypes} onDropRejected={handleDropRejected} maxFiles={1}>
            {({getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject}) => (
                <section>
                    <div className="mb-5">
                        <div {...getRootProps({
                            style: {
                                ...baseStyle,
                                ...(isDragActive ? activeStyle : {}),
                                ...(isDragAccept ? acceptStyle : {}),
                                ...(isDragReject ? rejectStyle : {})
                            }
                        })}>
                            <input name="picture" {...getInputProps()} />
                            <div className="text-center m-b-sm">
                                <p> {props.textDisplayed} </p>
                                <button
                                    className="btn btn-primary"
                                    type="button"
                                >
                                    Sélectionner
                                </button>
                            </div>
                        </div>
                        <div id="error" className="alert alert-danger d-none mt-3"></div>
                    </div>
                </section>
            )}
        </Dropzone>
        :
        <div className="white-bg img-rounded" style={isImage ? {borderColor: "black", border: "solid 2px"} : {}}>
            {isImage ? <button
                className="btn btn-white text-danger btn-circle black-bg"
                style={{position: "absolute"}}
                onClick={removeFile}
                type="button"
            >X</button> : null}
            <div style={isImage ? {textAlign: "-webkit-center"} : {padding: "10px"}}>
                {(() => {
                    if (isImage) {
                        return (
                            <img className="img-responsive img-rounded"
                                 id="output"
                                 src={url == "" ? "" : url}
                                 alt="image impossible à charger"
                                 style={{maxHeight: "300px"}}
                            />
                        )
                    } else {
                        return url ? <div className="row">
                                <div className="col-sm-11">
                                    {props.fileLabel}<a href={url} target="_blank">
                                    <strong>
                                        {props.fileTitle || `${url}`.split("/").pop()}
                                    </strong>
                                </a>
                                </div>

                                <div className="col-sm-1 text-right">
                                    <strong className="pointer-event" onClick={removeFile}>X</strong>
                                </div>
                            </div>

                            : <p className={"ml-5"}>Document actuel : <strong>aucun</strong></p>;
                    }
                })()}
            </div>
        </div>
}

DragAndDrop.propTypes = {
    acceptedTypes: PropTypes.string.isRequired,
    textDisplayed: PropTypes.string.isRequired,
    file_url: PropTypes.string,
    setFile: PropTypes.func.isRequired,
    onClearedFile: PropTypes.func
}

export default DragAndDrop;