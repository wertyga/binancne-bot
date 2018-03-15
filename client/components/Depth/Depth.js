import './Depth.sass';

export default class Depth extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            buyDepth: this.props.buyDepth,
            sellDepth: this.props.sellDepth,
            different: 0
        };
    };

    componentDidUpdate(prevProps, prevState) {
        if(this.props.buyDepth !== prevProps.buyDepth || this.props.sellDepth !== prevProps.sellDepth) {
            this.calculateDifferentDepth(this.props.buyDepth, this.props.sellDepth);
        };
    };

    calculateDifferentDepth(buy, sell) {
        // const buySumm = buy.reduce((a, b) => a + b, 0);
        // const sellSumm = sell.reduce((a, b) => a + b, 0);
        const diff = (buy - sell) / (buy / 100);
        
        this.setState({
            different: +diff.toFixed(2)
        });
    };

    render() {
        return (
            <div className="Depth">
                <span><strong>DEPTH: </strong></span>
                <div className="wrapper-depth">
                    <div className="buy">Buy depth: {this.props.buyDepth || 0}</div>
                    <div className="sell">Sell depth: {this.props.sellDepth || 0}</div>
                    <div className="different">
                        {this.state.different > 0 ?
                            <div className="positive">+ {this.state.different} %</div> :
                            <div className="negative">{this.state.different} %</div>
                        }
                    </div>
                </div>
            </div>
        );
    };
};