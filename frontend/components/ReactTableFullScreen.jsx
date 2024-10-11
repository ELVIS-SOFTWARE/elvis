import React, {Fragment} from "react";
import ReactTable from "react-table";
import fscreen from "fscreen";
import PropTypes from "prop-types";

export function goFullScreen(tableName) {
    window.dispatchEvent(
        new Event(`reactTableFullscreen${tableName}Change`));
}

class FullScreen extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            classNames: [(props.className || ""), "fullscreen"]
        }

        if (props.handle.active) {
            this.state.classNames.push('fullscreen-enabled');
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot)
    {
        if(prevProps.handle.active !== this.props.handle.active)
        {
            if(this.props.onChange)
                this.props.onChange(this.props.handle.active, this.props.handle);

            if (this.props.handle.active)
            {
                this.setState({classNames: [...this.state.classNames, 'fullscreen-enabled']})
            }
            else
            {
                const index = this.state.classNames.indexOf('fullscreen-enabled');

                if(index !== -1)
                {
                    this.state.classNames.splice(index, 1);
                }
            }
        }
    }

    render()
    {
        return <div
            className={this.state.classNames.join(' ')}
            ref={this.props.handle.node}
            style={this.props.handle.active ? { height: '100%', width: '100%' } : undefined}
        >
            {this.props.children}
        </div>
    }
}

class ReactTableFullScreen extends React.Component
{
    constructor(props)
    {
        super(props);

        const {tableName, showDefaultFullScreenButton} = this.props;

        this.state = {
            active: false,
            tableName: tableName,
            showDefaultFullScreenButton: showDefaultFullScreenButton
        }

        this.node = React.createRef();

        this.enter = this.enter.bind(this);
        this.exit = this.exit.bind(this);
        this.tableName = tableName;
    }

    componentDidMount()
    {
        const handleChange = () =>
        {
            this.setState({active: fscreen.fullscreenElement === this.node.current});
        };

        fscreen.addEventListener('fullscreenchange', handleChange, false);
        window.addEventListener(`reactTableFullscreen${this.state.tableName}Change`, this.enter, false);
    }

    componentWillUnmount()
    {
        fscreen.removeEventListener('fullscreenchange', this.handleChange, false);
        window.removeEventListener(`reactTableFullscreen${this.state.tableName}Change`, this.enter, false);
    }
    enter()
    {
        if (fscreen.fullscreenElement)
        {
            return fscreen.exitFullscreen().then(() =>
            {
                return fscreen.requestFullscreen(this.node.current);
            });
        }
        else if (this.node.current)
        {
            return fscreen.requestFullscreen(this.node.current);
        }
    }

    exit()
    {
        if (fscreen.fullscreenElement === this.node.current)
        {
            return fscreen.exitFullscreen();
        }

        return Promise.resolve();
    }

    render()
    {
        const {tableName, showDefaultFullScreenButton, ...tableProps} = this.props;

        return <Fragment>
            {this.state.showDefaultFullScreenButton ?
                <button className="btn btn-primary" onClick={this.enter} data-tippy-content="Mettre le tableau en plein écran">
                    <i className="fas fa-expand-arrows-alt"></i>
                </button> : ''}

            <FullScreen handle={{
                active: this.state.active,
                enter: this.enter,
                exit: this.exit,
                node: this.node
            }}>
                <ReactTable {...tableProps} />
            </FullScreen>
        </Fragment>
    }
}

ReactTableFullScreen.propTypes = {
    showDefaultFullScreenButton: PropTypes.bool,
    tableName: PropTypes.string.isRequired,
}

export default ReactTableFullScreen;
