import React from 'react';

/**
 * Composant permettant de gérer les images. L'image s'affiche dans le cas où elle existe avec un bouton de suppression.
 * Sinon un composant de selection d'image s'affiche.
 *
 * Pour fonctionner correctement, ce composant dois avoir quelques propriétées:
 * <ul>
 *     <li>Un titre (title) => C'est le label</li>
 *     <li>un nom (name) => c'est l'attribut name de l'input pour les formulaires</li>
 *     <li>l'url de l'image (picture_url) => L'url de l'image si elle existe sinon null (nil/undefined)
 * </ul>
 *
 * En plus de l'input de l'image, un input nommé 'image_supp' est créer. Il prend la valeur d'un booleen qui indique
 * si l'image présente à été supprimer ou pas. (true ausi si changement car l'ancienne image est supprimée...)
 */
export default class GestionImage extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            picture_url: props.picture_url === undefined ? '' : props.picture_url
        }
    }

    render()
    {
        return <div>
            <label htmlFor={this.props.name}>{this.props.title}</label>
            <input type="hidden" name="image_supp" value={this.state.picture_url === undefined} />
            {
                this.state.picture_url ?
                    <div className="img-container">
                        <img height={200} src={this.state.picture_url} alt="img manquante"/>
                        <button title="Supprimer l'image" className="pull-right" onClick={() => this.setState({picture_url: undefined})}>X</button>
                    </div>
                    :
                    <div className="fileinput fileinput-new input-group" data-provides="fileinput">
                    <div className="form-control" data-trigger="fileinput">
                        <i className="glyphicon glyphicon-file fileinput-exists"/>
                        <span className="fileinput-filename"/>
                    </div>
                    <span className="input-group-addon btn btn-default btn-file">
                  <span className="fileinput-new">Choisir Image</span>
                  <span className="fileinput-exists">Changer</span>
                  <input type="file" name={this.props.name} />
              </span>
                    <a href="#" className="input-group-addon btn btn-default fileinput-exists"
                       data-dismiss="fileinput">Supprimer</a>
                </div>
            }
        </div>
    }
}