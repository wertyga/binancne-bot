import axios from 'axios';

import Input from '../../common/Input/Input';

export default class limits extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            takeProfit: {
                value: this.props.takeProfit || '',
                fixedValue: this.props.takeProfit || '',
                hidden: true
            },
            buyLimit1: {
                value: this.props.buyLimit1 || '',
                fixedValue: this.props.buyLimit1 || '',
                hidden: true
            },
            buyLimit2: {
                value: this.props.buyLimit2 || '',
                fixedValue: this.props.buyLimit2 || '',
                hidden: true
            },
            buyLimit3: {
                value: this.props.buyLimit3 || '',
                fixedValue: this.props.buyLimit3 || '',
                hidden: true
            },
            loading: false,
            error: ''
        }
    };

    componentDidUpdate(prevProps, prevState) {
        if(this.state.loading !== this.props.loading) {
            this.setState({
                loading: this.props.loading
            });
        };
        if(this.props.buyLimit1 !== prevProps.buyLimit1) {
            this.setState({
                buyLimit1: {
                    value: this.props.buyLimit1 || '',
                    fixedValue: this.props.buyLimit1 || '',
                    hidden: true
                }
            });
        };
        if(this.props.buyLimit2 !== prevProps.buyLimit2) {
            this.setState({
                buyLimit2: {
                    value: this.props.buyLimit2 || '',
                    fixedValue: this.props.buyLimit2 || '',
                    hidden: true
                }
            });
        };
        if(this.props.buyLimit3 !== prevProps.buyLimit3) {
            this.setState({
                buyLimit3: {
                    value: this.props.buyLimit3 || '',
                    fixedValue: this.props.buyLimit3 || '',
                    hidden: true
                }
            });
        };
        if(this.props.takeProfit !== prevProps.takeProfit) {
            this.setState({
                takeProfit: {
                    value: this.props.takeProfit || '',
                    fixedValue: this.props.takeProfit || '',
                    hidden: true
                }
            });
        };
    };

    onChangeInput = e => {
        if((e.target.value).match(/[a-z]/gi)) return;
        this.setState({
            [e.target.name]: {
                ...this.state[e.target.name],
                value: e.target.value
            }
        });
    };

    onClickInput = name => {
        this.setState({
            [name]: {
                ...this.state[name],
                hidden: false
            },
            error: ''
        });
    };

    confirmChangingInput = name => {
        this.setState({ loading: true });
        axios.post(`/api/limits`, { order: name, price: this.state[name].value, id: this.props.id })
            .then(order => {
                this.setState({
                    [name]: {
                        ...this.state[name],
                        hidden: true,
                        fixedValue: this.state[name].value
                    },
                    loading: false
                });
                this.props.limitFunc({ order: name, price: this.state[name].value })
            })
            .catch(err => {
                this.setState({
                    error: err.response ? err.response.data.error : err.message,
                    loading: false
                })
            })
    };

    cancelInputingInput = name => {
        this.setState({
            [name]: {
                ...this.state[name],
                hidden: true,
                value: this.state[name].fixedValue
            }
        });
    };

    render() {
        return (
            <div className="Limits" style={{ padding: ' 20px 0' }}>
                {this.state.error && <div className="error">{this.state.error}</div>}
                <Input
                    name='takeProfit'
                    value={this.state.takeProfit.value}
                    label={`Profit to ${this.props.pair}`}
                    hidden={this.state.takeProfit.hidden}
                    disabled={this.state.loading}
                    onChange={this.onChangeInput}
                    onClick={this.onClickInput}
                    confirmChanging={this.confirmChangingInput}
                    fixedValue={this.state.takeProfit.fixedValue}
                    cancelInputing={this.cancelInputingInput}
                />
                <Input
                    name='buyLimit1'
                    value={this.state.buyLimit1.value}
                    label={`buyLimit 1 to ${this.props.pair}`}
                    hidden={this.state.buyLimit1.hidden}
                    disabled={this.state.loading}
                    onChange={this.onChangeInput}
                    onClick={this.onClickInput}
                    confirmChanging={this.confirmChangingInput}
                    fixedValue={this.state.buyLimit1.fixedValue}
                    cancelInputing={this.cancelInputingInput}
                />
                <Input
                    name='buyLimit2'
                    value={this.state.buyLimit2.value}
                    label={`buyLimit 2 to ${this.props.pair}`}
                    hidden={this.state.buyLimit2.hidden}
                    disabled={this.state.loading}
                    onChange={this.onChangeInput}
                    onClick={this.onClickInput}
                    confirmChanging={this.confirmChangingInput}
                    fixedValue={this.state.buyLimit2.fixedValue}
                    cancelInputing={this.cancelInputingInput}
                />
                <Input
                    name='buyLimit3'
                    value={this.state.buyLimit3.value}
                    label={`buyLimit 3 to ${this.props.pair}`}
                    hidden={this.state.buyLimit3.hidden}
                    disabled={this.state.loading}
                    onChange={this.onChangeInput}
                    onClick={this.onClickInput}
                    confirmChanging={this.confirmChangingInput}
                    fixedValue={this.state.buyLimit3.fixedValue}
                    cancelInputing={this.cancelInputingInput}
                />
            </div>
        );
    };
};