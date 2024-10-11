import React from "react";

export default function RestartingMessage() {
    return (
        <div className="w-100">
            <h1 className="text-center">
                Redémarrage en cours...
                <div className="sk-spinner sk-spinner-fading-circle m-n"
                     style={{
                         display: 'inline-block'
                     }}>
                    <div className="sk-circle1 sk-circle"></div>
                    <div className="sk-circle3 sk-circle"></div>
                    <div className="sk-circle4 sk-circle"></div>
                    <div className="sk-circle5 sk-circle"></div>
                    <div className="sk-circle6 sk-circle"></div>
                    <div className="sk-circle7 sk-circle"></div>
                    <div className="sk-circle8 sk-circle"></div>
                    <div className="sk-circle9 sk-circle"></div>
                    <div className="sk-circle10 sk-circle"></div>
                    <div className="sk-circle11 sk-circle"></div>
                    <div className="sk-circle12 sk-circle"></div>
                </div>
            </h1>
            <p>Le redémarrage peut prendre quelques minutes.</p>
            <p>La page se rechargera automatiquement.</p>
        </div>
    )
}