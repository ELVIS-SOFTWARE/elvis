import React, {useEffect} from "react";
import {useState} from "react";
import * as api from "../../tools/api";
import swal from "sweetalert2";
import {EditorState, convertToRaw, convertFromRaw, ContentState} from 'draft-js';
import PluginsList from "./PluginsList";
import RestartingMessage from "./RestartingMessage";


export default function Plugins(props) {
    const [plugins, setPlugins] = useState([]);
    const [selectedPlugins, setSelectedPlugins] = useState({});
    const [activatedPlugins, setActivatedPlugins] = useState({});
    const [firstActivatedState, setFirstActivatedState] = useState({});
    const [is_restarting, setIsRestarting] = useState(false);
    let interval;


    useEffect(() => {
        getPlugins()
    }, []);

    useEffect(() => {
        if (plugins.length > 0) {
            const initialActivatedState = {};
            plugins.forEach((plugin) => {
                initialActivatedState[plugin.id] = !!plugin.activated_at;
            });
            setActivatedPlugins(initialActivatedState);
            setFirstActivatedState(initialActivatedState); // save initial state for conf page
        }
    }, [plugins]);

    function startTimer() {
        interval = setInterval(() => {
            checkRestartStatus();
        }, 3000);
    }

    useEffect(() => {
        if (is_restarting) {
            startTimer()
        }
        return () => {
            clearInterval(interval); // Nettoyer l'intervalle lors du démontage du composant
        };
    }, [is_restarting]);


    function getPlugins() {
        api.set()
            .success(res => {
                setPlugins(res.plugins);
                setIsRestarting(res.is_restarting);

                // Convertir le contenu JSON brut en ContentState
                let savedContentRaw = null;
                let savedContentState = null;
                if (res.display_text != null) {
                    try {
                        savedContentRaw = JSON.parse(res.display_text);
                        savedContentState = convertFromRaw(savedContentRaw);
                    } catch (e) {
                        savedContentState = ContentState.createFromText(res.display_text);
                    }
                    setEditorState(EditorState.createWithContent(savedContentState));
                }
            })
            .error(res => {
                swal("Une erreur est survenue lors de la récupération des plugins", res.error, "error");
                setIsRestarting(false)
            })
            .get("./plugins", {});
    }

    function handlePluginStatusChange(pluginID, updatedActivated) {
        setSelectedPlugins((prevSelectedPlugins) => ({
            ...prevSelectedPlugins,
            [pluginID]: updatedActivated,
        }));
    }

    function checkRestartStatus() {
        try {
            api.set()
                .success(res => {
                    setIsRestarting(res.is_restarting);
                    if (!res.is_restarting) {
                        clearInterval(interval); // Stop checking once restart is completed
                        getPlugins(); // Refresh plugin data after restart
                    }
                })
                .error(err => {
                    setIsRestarting(false);
                    clearInterval(interval); // In case of error, stop checking
                })
                .get('/plugins', {})
        } catch (error) {
            console.error("Exception while checking restart status:", error);
        }
    }

    function handleSaveAndRestart() {
        api.set()
            .useLoading()
            .success(res => {
                if(res.restart)
                    setIsRestarting(true);
                swal(`Les plugins ont été enregistrés avec succès`, res.message, "success");
            })
            .error(res => {
                swal("Une erreur est survenue lors de l'enregistrement des plugins", res.error, "error");
            })
            .post('/plugins', {
                data: selectedPlugins,
                rollback: document.getElementById('rollback').checked ? 'on' : 'off'
            });
    }

    function toggleActivation(pluginID) {
        setActivatedPlugins((prevActivatedPlugins) => ({
            ...prevActivatedPlugins,
            [pluginID]: !prevActivatedPlugins[pluginID], // Inversion de l'état actuel du plugin
        }));

        handlePluginStatusChange(pluginID, !activatedPlugins[pluginID]);
    }

    if (is_restarting) {
        return <RestartingMessage/>;
    } else if (plugins) {
        return <PluginsList
            plugins={plugins}
            selectedPlugins={selectedPlugins}
            handleStatus={handlePluginStatusChange}
            handleSave={handleSaveAndRestart}
            toggle={toggleActivation}
            activatedPlugins={activatedPlugins}
            firstActivatedState={firstActivatedState}
        />
    } else {
        return (
            <p className="nodata">Aucun plugin</p>
        )
    }
}