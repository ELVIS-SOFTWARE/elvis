import React from 'react';
import PropTypes from 'prop-types';

import _ from "lodash";
import CreatableSelect from "react-select/lib/Creatable";

import swal from "sweetalert2";

/**
 * Il y as quelques restrictions pour utiliser ce SelectMultiple.
 *
 * Il doit y avoir certaines propriété:
 * <ul>
 *  <li> Un Titre (title) qui seras le contenue du label affiché => Obligatoire </li>
 *  <li>Un nom (name) qui seras le nom de l'input à utilisé pour le formulaire parent => Optionnel</li>
 *  <li>
 *      Tous les champs possible (all_features) qui contient un tableau de tableau représentant tous les élement possible. =>Obligatoire
 *      <ul>
 *          <li> Chaque tableau doivent contenir deux élément, le premier étant le label/valeur affiché et le second la valeur/id </li>
 *          <ul>
 *              <li> => Ce qui donne [["un label", 0], ["un label2", 45]]</li>
 *          </ul>
 *      </ul>
 *  </li>
 *  <li>
 *      Tous les champs séléctionné (features) qui est un tableau du type de la valeur (id ?) => Optionnel
 *      <ul>
 *          <li>=> Ce qui donne [0, 45] pour l'exemple précédent si les deux éléments sont séléctionnés</li>
 *      </ul>
 *  </li>
 * </ul>
 */
export default class SelectMultiple extends React.Component
{
    constructor(props) {
        super(props);

        this.state = {
            selectedFeatures: [],
            features: this.props.all_features.map(f => ({label: f[0], value: f[1]}))
        }

        if(this.props.features !== undefined && this.props.features.length > 0)
        {
            this.state.selectedFeatures = this.state.features.filter(f => this.props.features.includes(f.value));
            _.remove(this.state.features, this.state.selectedFeatures);
        }
    }

    handleChange(values, actionMeta)
    {
        console.log(values, actionMeta);
        if(actionMeta.action === 'select-option')
        {
            const newFeature = this.props.isMulti ? _.last(values) : values;

            console.log(newFeature);

            if(this.props.isMulti)
                _.remove(this.state.features, newFeature);

            return this.setState({selectedFeatures: [
                    ...(this.props.isMulti ? this.state.selectedFeatures : []),
                    newFeature
                ]});
        }
        else if(actionMeta.action === 'remove-value')
        {
            const newFeatures = [...this.state.selectedFeatures];
            _.remove(newFeatures, actionMeta.removedValue);

            if(!this.state.features.includes(actionMeta.removedValue))
                this.state.features.push(actionMeta.removedValue);

            return this.setState({
                selectedFeatures: newFeatures,
            });
        }
        else if(actionMeta.action === 'clear')
        {
            swal({
                title:
                    "Êtes vous sûr de supprimer toutes les " + this.props.title,
                type: "warning",
                confirmButtonText: "Oui !",
                cancelButtonText: "Non",
                showCancelButton: true,
            }).then(willDelete => {
                if (willDelete.value)
                {
                    this.state.features.push(...this.state.selectedFeatures.filter(f => !this.state.features.includes(f)));

                    this.setState({
                        selectedFeatures: [],
                    });
                }
            });
        }
    }

    render()
    {
        return <div>
            <input type="hidden"
                   className="d-none none"
                   value={this.props.isMulti ? this.state.selectedFeatures.map(f => f.value) : this.state.selectedFeatures[0].value}
                   name={this.props.name}
                   style={{display: "none"}} />
            <label>{this.props.title}</label>

            <CreatableSelect
                isMulti={this.props.isMulti}
                options={this.state.features}
                value={this.state.selectedFeatures}
                onChange={this.handleChange.bind(this)}/>
        </div>
    }
}

SelectMultiple.propTypes = {
    title: PropTypes.string.isRequired,
    name: PropTypes.string,
    all_features: PropTypes.array.isRequired,
    features: PropTypes.array,
    isMulti: PropTypes.bool,
}