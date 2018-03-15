import { connect } from 'react-redux';

import io from 'socket.io-client';

import { getResult } from '../../actions/pairsAPI';

import './Result.sass';

const mapState = state => {
    return {
        result: state.result
    }
};

@connect(mapState, { getResult })
export default class Result extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            result: this.props.result,
            error: ''
        };
    };

    componentDidUpdate(prevProps, prevState) {
        if(this.props.result !== prevProps.result) {
            this.setState({
                result: this.props.result
            });
        };
    };
    
    componentDidMount() {
        this.socket = io('/');
        this.socket.on('set-result', result => {
            this.setState({ result });
        });

        this.props.getResult()
            .catch(err => {
                this.setState({
                    error: err.response ? err.response.data.error : err.message
                });
            })
    };
    
    render() {

        const error = <div className="error">{this.state.error}</div>
        const result = <div className="result">
            {Object.keys(this.state.result).map(item =>
                <div key={item}><strong>{item}: </strong><span>{this.state.result[item] > 0 ?
                    `+ ${this.state.result[item]} %` :
                    `${this.state.result[item]} %`
                }
                </span></div>
            )}
        </div>

        const newResult = <div className="result">
            Result: {this.state.result > 0 ? `+${this.state.result}` : this.state.result} %
        </div>

        return(
            <div className="result">{this.state.error ? error : newResult}</div>
        );
    }
};