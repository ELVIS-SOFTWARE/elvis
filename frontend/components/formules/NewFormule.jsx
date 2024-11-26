import React from 'react';

export default function NewFormule() {
    return (
        <div className="container">
            <h1>Nouvelle formule</h1>
            <form>
                <div className="form-group">
                    <label htmlFor="nom">Nom de la formule</label>
                    <input type="text" className="form-control" id="nom" placeholder="Nom de la formule"/>
                </div>
                <div className="form-group">
                    <label htmlFor="activites">Activités ou familles d'activités</label>
                    <input type="text" className="form-control" id="activites" placeholder="Activités ou familles d'activités"/>
                </div>
                <button type="submit" className="btn btn-primary">Enregistrer</button>
            </form>
        </div>
    );
}