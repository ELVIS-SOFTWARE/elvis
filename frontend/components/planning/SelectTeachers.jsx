import React from "react";
export default function SelectTeachers({listTeacher, selectedName, currentUser, date}) {
    return (
        <div className="row wrapper border-bottom white-bg page-heading">
            <h2>
                <div className="dropdown">
                    Planning de
                    <button data-toggle="dropdown"
                            className="dropdown-toggle transparentSelector font-underlined img-rounded"
                            aria-expanded="false"> {selectedName.last_name} {selectedName.first_name} <b className="caret"></b>
                    </button>
                    <ul className="dropdown-menu m-t-xs">
                        {
                            listTeacher.map((data,index) =>
                            {
                                const {first_name, last_name, planning}= data;
                                if(currentUser === planning.id)
                                    return(<li key={index}><a href={`/planning/simple/${date}`}>{last_name} {first_name}</a></li>)
                                return(<li key={index}><a href={`/planning/simple/${date}/${planning.id}`}>{last_name} {first_name}</a></li>)
                            })
                        }
                    </ul>
                </div>
            </h2>
        </div>
    )
}