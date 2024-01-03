import React, {useState} from "react";
import PluginCard from "./PluginCard";
import RestartingMessage from "./RestartingMessage";

export default function PluginsList({ plugins, selectedPlugins, handleStatus, handleSave, toggle, activatedPlugins, firstActivatedState }) {

    return (
        <div>
            <p className="p-2"
               style={{
                   color: '#00283B',
                   fontWeight: '600',
                   fontSize: '16px'
               }}>
                Découvrez et activez les plugins dont vous avez besoin.
            </p>
            <div className="d-flex flex-sm-row  flex-wrap mb-5">
                {plugins.map((plugin) => (
                    <PluginCard
                        key={plugin.id}
                        plugin={plugin}
                        setting_path={`/settings/plugin/${plugin.id}`}
                        pluginStatus={handleStatus}
                        handleToggleActivation={() => toggle(plugin.id)}
                        pluginActivated={activatedPlugins[plugin.id]}
                        initialyActivated={firstActivatedState[plugin.id]}
                    />
                ))}
            </div>

            <div style={{
                marginRight: '25rem',
                marginBottom: '5rem'
            }}>
                <div className="d-flex justify-content-end mb-3">
                    <input className="my-auto" id="rollback" name="rollback" type="checkbox"/>
                    <label className="my-auto ml-2" htmlFor="rollback">Supprimer les données des plugins
                        décochés</label>
                </div>
                <div className="d-flex justify-content-end ml-5">
                    <input className="btn btn-success" type="submit" value="enregistrer et redémarrer"
                           onClick={handleSave}/>
                </div>
            </div>
        </div>
    );
}
