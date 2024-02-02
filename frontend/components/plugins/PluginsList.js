import React, {useState} from "react";
import PluginCard from "./PluginCard";
import RestartingMessage from "./RestartingMessage";
import PluginActivationModal from "./PluginActivationModal";


export default function PluginsList({
                                        plugins,
                                        selectedPlugins,
                                        handleStatus,
                                        handleSave,
                                        toggle,
                                        activatedPlugins,
                                        firstActivatedState,
                                        isModalOpen,
                                    }) {


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
        </div>
    );
}
