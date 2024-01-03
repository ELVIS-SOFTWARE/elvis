import React, { Fragment } from "react";
import { fullname } from "../../tools/format";
import Input from "../common/Input";


const SelectSameAs = ({ setSameAs, family, accessor, format, currentUser }) => {
    //console.log(family)

    family = family.filter(f => !Array.isArray(f[accessor])  || (Array.isArray(f[accessor]) && format(f[accessor]) != undefined))

    const currentValue = () =>{
        for(let member of family){
            if(Array.isArray(member[accessor])){

                for(let option of member[accessor]){
                    for(let element of currentUser[accessor]){
                        if(element.id === option.id)
                            return JSON.stringify(option)
                    }
                }
            }
            else{
                if(member[accessor] === currentUser[accessor])
                    return JSON.stringify(member[accessor])
            }
        }

        return ""

    }
        
    const options = 
    family.map((f, fIndex) => (
        <Fragment key={fIndex}>
            {Array.isArray(f[accessor]) ? (
                
                f[accessor].map((obj, index) => (
                    <option
                        key={`${fIndex}.${index}`}
                        value={JSON.stringify(obj)}
                    >
                        {`${fullname(f)} ${format(obj)}`}
                    </option>
                ))
            ) : (
                
                <option value={JSON.stringify(f[accessor])}>
                    {`${fullname(f)} ${format(f[accessor])}`}
                </option>
            )}
        </Fragment>
    ));

    return (
        <div className="row">
            <div className="col-sm-2">{"Identique à"}</div>
            <div className="col-sm-10 form-group">
                <select
                    defaultValue={currentValue()}
                    className="form-control"
                    onChange={e => setSameAs(e.target.value)}
                    disabled={options.length == 0} 
                >
                    <option value="">Personne</option>
                    {options}
                </select>
            </div>
        </div>
    );
};

export default SelectSameAs;
