import React from 'react';

function _buildElement(compOrElem, props, children) {
    if (compOrElem) {
        if (React.isValidElement(compOrElem)) {
            return compOrElem;
        } else {
            return React.createElement(compOrElem, props, children);
        }
    } else {
        return null;
    }
}

export default class LazyLoad extends React.Component {

    static propTypes = {
        component : React.PropTypes.oneOfType([ React.PropTypes.func, React.PropTypes.element ]).isRequired,
        errorComponent : React.PropTypes.oneOfType([ React.PropTypes.func, React.PropTypes.element ]),
        loadingComponent : React.PropTypes.oneOfType([ React.PropTypes.func, React.PropTypes.element ]),
        ajax : React.PropTypes.func.isRequired                                                                  // function that returns Ajax Promise
    };

    static defaultProps = {
        errorComponent : null,
        loadingComponent : null
    };

    constructor(props) {
        super();
        this.state = { element : null, loading : true };
        this._setup = this._setup.bind(this);
        this.reload = this.reload.bind(this);
        this.loadingElement = _buildElement(props.loadingComponent, props, []);
        this.mounted = false;
    }

    _setup(props) {
        if (props.component == undefined) {
            throw new Error('Property component of LazyLoad is required');
        }
        let promise = props.ajax();
        if (promise) {
            promise.then((res) => {
                    if (this.mounted) {
                        let data = res.data;
                        const cProps = {...props, data: data};
                        const element = _buildElement(props.component, cProps, props.children);
                        this.setState({element: element, loading: false});
                    }
                })
                .catch((err) => {
                    console.log('Unable to load resource via ajax for LazyLoad.', err);
                    if (this.mounted) {
                        if (props.errorComponent) {
                            const cProps = {...props, data: err.response.data};
                            const element = _buildElement(props.errorComponent, cProps, props.children);
                            this.setState({element: element, loading: false});
                        } else {
                            this.setState({element: null, loading: false});
                        }
                    }
                });
        } else {
            throw new Error('Ajax returned ' + promise + ' instead of Promise.');
        }
    }

    reload() {
        this.setState({ element : null, loading : true });
        this._setup(this.props);
    }

    componentWillMount() {
        this.mounted = true;
        this._setup(this.props);
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    componentWillReceiveProps(newProps) {
        if (this.props.loadingComponent != newProps.loadingComponent) {
            this.loadingElement = _buildElement(newProps.loadingComponent, newProps, []);
        }
        this.props = newProps;
    }

    render() {
        const {element, loading} = this.state;
        if (element == null) {
            if (loading) {
                return this.loadingElement;
            } else {
                return null;
            }
        } else {
            return element;
        }
    }

}
