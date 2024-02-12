import React from "react";
import placeholderPack from "../../../images/placeholder_pack.png";

export default function placeholderCard(props) {
    const user = props.user;

    return (
        <div className="col-md-4 mt-lg-3 px-lg-4 p-0">
            <div className="placeholder-card mx-5 mt-3 m-lg-0">
                <img
                    className="img-fluid"
                    style={{height: '100%', width: '100%', borderRadius: '5px'}}
                    src={placeholderPack}
                    alt="Card image cap"
                />
                <div className="image-overlay">
                    <div className="overlay-text-container">
                        <h2 className="overlay-text font-bold">Pas encore inscrit ?</h2>
                        <p className="overlay-text">Réalise une demande d'inscription et sélectionne une de nos
                            activités</p>
                    </div>
                    <a className="card-banner-bottom background-lightred animated fadeIn"
                       style={{borderRadius: '0 0 5px 5px'}}
                       href={"/inscriptions/new?user_id=" + user.id}>
                        <div className="text-white font-bold pl-4">
                            JE M'INSCRIS<span className="pull-right pr-3"> > </span>
                        </div>
                    </a>
                </div>
            </div>

        </div>

    );
}