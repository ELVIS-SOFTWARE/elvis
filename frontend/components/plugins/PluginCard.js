import React, {useState} from "react";
import pluginImgDefault from "./icons8-puzzle-150.svg";
import Switch from "react-switch";

export default function PluginCard({plugin, setting_path, handleToggleActivation, pluginActivated, initialyActivated}) {
const plugin_id = plugin.id;
    return (
        <div
            key={plugin.id}
            className="card m-4"
            style={{
                borderRadius: "3px",
                border: "0px",
                width: "324px",
                height: "435px",
            }}
        >
            <div
                className="card-header p-0 m-0 d-flex justify-content-center align-items-center"
                style={{
                    maxWidth: "324px",
                    height: "240px",
                    backgroundColor: "#00334A",
                    borderRadius: "3px 3px 0 0",
                }}
            >
                <img
                    src={`${plugin.image || pluginImgDefault}`}
                    className="card-img-top img-fluid"
                    alt="..."
                    style={{
                        maxHeight: "95%",
                        maxWidth: "95%",
                        width: "auto",
                        height: "auto",
                    }}
                />
            </div>

            <div className="card-body p-4 d-flex align-content-between flex-wrap">
                <div className="d-flex justify-content-between align-items-baseline w-100 h-25">
                    <p
                        className="h4 p-0 m-0 col-6"
                        style={{
                            color: "#00334A",
                            fontWeight: "700",
                            fontSize: "20px",
                        }}
                    >
                        {plugin.display_name}
                    </p>
                    <p className="m-0 pr-0">{plugin.author}</p>
                </div>
                <div
                    className="card-text pt-3 w-100 mb-3"
                    style={{
                        color: "#00334A",
                        fontWeight: "400",
                        fontSize: "14px",
                        lineHeight: "26.4px",
                        height: "auto",
                        overflow: "hidden",
                    }}
                >
                    <p
                        style={{
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            boxOrient: "vertical",
                            lineClamp: 3, // Nombre de lignes à afficher avant troncature => firefox / standardisé
                            WebkitLineClamp: 3, // Nombre de lignes à afficher avant troncature => chromium
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {plugin.description}
                    </p>
                    <div className="d-flex justify-content-center">
                        {/* Conditionally render the button */}
                        {plugin.name === "elvis_plugin_student_payments" && pluginActivated && (
                            <a
                                href={`/student_payments/${plugin.id}/description`}
                                className="btn btn-sm"
                            >
                                <i className="fa fa-external-link-alt mr-1" />
                                En savoir plus
                            </a>
                        )}
                    </div>
                </div>

                <div className="card-text d-flex justify-content-between align-items-center w-100">
                    <div>PAYANT</div>
                    <div className="d-flex align-items-center">
                        {/*{pluginActivated && initialyActivated ? (*/}
                        {/*    <a*/}
                        {/*        href={setting_path}*/}
                        {/*        className="btn btn-sm mr-2"*/}
                        {/*        style={{*/}
                        {/*            color: "#006fb0",*/}
                        {/*            borderColor: "#006fb0",*/}
                        {/*        }}*/}
                        {/*    >*/}
                        {/*        <i className="fa fa-cog mr-1" />*/}
                        {/*        Configurer*/}
                        {/*    </a>*/}
                        {/*) : null}*/}
                        {typeof pluginActivated !== "undefined" && (
                            <Switch
                                checked={pluginActivated}
                                onChange={handleToggleActivation}
                                onColor={"#48b669"}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}