import React, {Component} from "react";
import PropTypes from "prop-types";

/**
 * A utiliser en tant que classe mère.
 */
export default class BaseParameters extends Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            activeTab: -1,
            tabsNames: this.props.tabsNames,
            divObjects: this.props.divObjects
        }

        // not in state because it's not a react variable && it's not a variable that we want to manually update
        this.showedTabs = [];
    }

    componentDidMount()
    {
        for (let i = 0; i < this.state.tabsNames.length; i++)
        {
            if(location.hash.includes('#tab-' + i))
            {
                this.setState({activeTab: i});
                return;
            }
        }

        this.setState({activeTab: 0});
    }

    componentDidUpdate(prevProps, prevState, snapshot)
    {
        if(this.state.activeTab !== prevState.activeTab)
            window.location.href = "#tab-" + this.state.activeTab;

        if(this.props.divObjects !== prevProps.divObjects)
            this.setState({divObjects: this.props.divObjects});
    }

    render()
    {
        return <React.Fragment>
            <div className="tabs-container" >
                <ul className="nav nav-tabs flex" role="tablist">
                    {this.state.tabsNames.map((tabName, i) =>
                    {
                        return <li id={"tab-" + i} key={"li-" + i} style={{ height: "auto" }} className={(this.state.activeTab === i ? "active" : "")}>
                            <a
                                key={"a-" + i}
                                data-toggle="tab"
                                href={"#tab-" + i}
                                className={"nav-link " + (this.state.activeTab === i ? "active show" : "")}
                                aria-expanded={(this.state.activeTab === i ? "true" : "false")}
                                onClick={(a) => this.jumpto(i)}
                            >
                                {tabName}
                            </a>
                        </li>
                    })}
                </ul>

                {/* Content */}
                <div className="tab-content">

                    {this.state.divObjects.map((divObj, i) =>
                    {
                        if(!this.showedTabs.includes(i) && this.state.activeTab === i)
                        {
                            this.showedTabs.push(i);
                        }

                        return <div key={"div-" + i} className={"tab-pane " + (this.state.activeTab === i ? "active" : "")}>
                            <div className="panel-body">{this.state.activeTab === i || this.showedTabs.includes(i) ? divObj : ""}</div>
                        </div>
                    })}
                </div>
            </div>
        </React.Fragment>
    }

    jumpto(index)
    {
        this.setState({activeTab: index});
    }
}

BaseParameters.propTypes = {
    tabsNames: PropTypes.array,
    divObjects: PropTypes.array
}