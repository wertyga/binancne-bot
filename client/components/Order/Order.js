import axios from 'axios';
import { connect } from 'react-redux';

import classnames from 'classnames';

import path from 'path';

import { closeOrder } from '../../actions/pairsAPI';
import { calculatePercentProfit } from '../common/commonFunctions';

import { exponentialMovingAverage, signalMACD, macdCalculate, simpleMA } from '../../../server/common/ema';

import Depth from '../Depth/Depth';
import Input from '../common/Input/Input';
import Limits from '../common/Limits/Limits';

import './Order.sass';


@connect(null, { closeOrder })
export default class Order extends React.Component {
    constructor(props) {
        super(props);

        const percent =
            !!this.props.buyPrice ?
            this.calculateClosePercent(this.props.currentPrice, this.props.buyPrice) :
            null;

        this.youCanBuyPair = 2;
        this.negativePercent = -10;

        this.initialState = {
            startTime: this.props.startTime || '',
            signPrice: this.calculateClosePercent(this.props.currentPrice, this.props.startPrice),
            percent,
            canBuy: false,
            _id: this.props._id,
            pair: this.props.pair || '',
            buyPrice: this.props.buyPrice || '',
            currentPrice: this.props.currentPrice || '',
            prevPrice: 0,
            interval: this.props.interval || '',
            loading: false,
            data: [],
            error: '',
            buyDate: this.props.createdAt,
            buyed: false,
            profit: '',
            closePrice: this.props.closePrice,
            buyDepth: 0,
            sellDepth: 0,
            depth: false,
            localMin: this.props.localMin,
            input: {
                fixedValue: this.props.comment || '',
                value: this.props.comment || '',
                hidden: true
            },
            buyLimit1: this.props.buyLimit1 || '',
            buyLimit2: this.props.buyLimit2 || '',
            buyLimit3: this.props.buyLimit3 || '',
            takeProfit: this.props.takeProfit || ''
        };

        this.state = this.initialState;
    };

    componentDidMount() {
        if(this.state.buyPrice && !this.state.closePrice) {
            this.setState({
                percent: this.calculateClosePercent(this.state.currentPrice, this.state.buyPrice),
            });
        } else if(this.state.buyPrice && this.state.closePrice) {

            this.setState({
                profit: this.calculateClosePercent(this.state.closePrice, this.state.buyPrice)
            });
        };

        this.timer = setInterval(() => this.showOrder(true), 30000)
    };

    componentDidUpdate(prevProps, prevState) {
        if(this.state.data !== prevState.data && this.state.data.length > 0) {
            google.charts.load('current', {'packages':['corechart']});
            google.charts.setOnLoadCallback(this.drawChart);

            google.charts.load('current', {packages: ['corechart', 'line']});
            google.charts.setOnLoadCallback(this.drawMacdChart);
            google.charts.setOnLoadCallback(this.drawSeveElevenChart);
        };

        if(this.state.currentPrice !== prevState.currentPrice) {
            // if(this.state.buyPrice && !this.state.closePrice) {
            //     this.setState({
            //         percent: this.calculateClosePercent(this.state.currentPrice, this.state.buyPrice)
            //     })
            // };
            this.setState({
                signPrice: this.calculateClosePercent(this.state.currentPrice, this.props.startPrice)
            });
        };
    };

    componentWillUnmount() {
        if(this.timer) clearInterval(this.timer)
    };

    drawAllCharts = () => {
        if(this.state.data.length > 0) {
            google.charts.load('current', {'packages':['corechart']});
            google.charts.setOnLoadCallback(this.drawChart);

            google.charts.load('current', {packages: ['corechart', 'line']});
            google.charts.setOnLoadCallback(this.drawMacdChart);
            google.charts.setOnLoadCallback(this.drawSeveElevenChart);
        };
    };

    drawSeveElevenChart = () => {
        const dataEma = this.state.data.map(item => {
            return {
                time: item['Open time'],
                price: item['Close']
            };
        });

        simpleMA(dataEma, 7);
        simpleMA(dataEma, 25);

        let dataColumns = [['Time', 'Ma-7', 'Ma-25']];
        dataEma.filter(item => item['ma-7'] && item['ma-25']).forEach(item => {
            let elem = [item['time'], item['ma-7'] || 0, item['ma-25'] || 0];
            dataColumns.push(elem);
        });
        const data = google.visualization.arrayToDataTable(dataColumns);

        let options = {
            colors: ['#ffda00', '#0a1dff'],
            width: 800,
            height: 400
        };

        const formatter = new google.visualization.NumberFormat({
            fractionDigits: 8
        });

        let chart = new google.visualization.LineChart(this.sevenEleven);
        formatter.format(data, 1);
        formatter.format(data, 2);
        chart.draw(data, options);
    };

    drawMacdChart = () => {
        const dataEma = this.state.data.map(item => {
            return {
                time: item['Open time'],
                price: item['Close']
            };
        });

        exponentialMovingAverage(dataEma, 12);
        exponentialMovingAverage(dataEma, 26);
        macdCalculate(dataEma);
        const signalMacd = signalMACD(dataEma);

        let dataColumns = [['Time', 'MACD', 'Signal']];
        signalMacd.forEach(item => {
            let elem = [item['time'], item.macd || 0, item.signal || 0];
            dataColumns.push(elem);
        });
        const data = google.visualization.arrayToDataTable(dataColumns);

        let options = {
            colors: ['#a52714', '#0f9d58'],
            width: 800,
            height : 200
        };

        const formatter = new google.visualization.NumberFormat({
            fractionDigits: 8
        });

        let chart = new google.visualization.LineChart(this.macdChart);
        formatter.format(data, 1);
        formatter.format(data, 2);
        chart.draw(data, options);
    };

    drawChart = () => {
        // let arr = ['Open time', 'Low price', 'Open price', 'Close price', 'High price']
        const arr = this.state.data.map(item => {
            return [
                item['Open time'].split('T')[1].split(':').slice(0,2).join(':'),
                { v: item['Low'], f: item['Low'].toFixed(8) },
                { v: item['Open'], f: item['Open'].toFixed(8) },
                { v: item['Close'], f: item['Close'].toFixed(8) },
                { v: item['High'], f: item['High'].toFixed(8) },
                `Time: ${item['Open time'].split('T')[1].split(':').slice(0,2).join(':')} : Open ${item['Open']} - Close ${item['Close']} : Low ${item['Low']} - High ${item['High']}`
            ]
        });
        let data = google.visualization.arrayToDataTable(arr, true);
        data.setColumnProperty(5, 'role', 'tooltip')
        let options = {
            title: this.props.pair,
            legend: 'none',
            bar: { groupWidth: '100%' }, // Remove space between bars.
            candlestick: {
                fallingColor: { strokeWidth: 1, fill: '#a52714', stroke: '#a52714' }, // red
                risingColor: { strokeWidth: 1, fill: '#0f9d58', stroke: '#0f9d58' }   // green
            },
            tooltip: {
                isHtml: true
            },
            width: 800,
            height : 500
        };

        let chart = new google.visualization.CandlestickChart(this.chart);

        // google.visualization.events.addListener(chart, 'select', e => {
        //     const {row, column} = chart.getSelection()[0];
        //     console.log(data.getValue(row, column))
        // })

        chart.draw(data, options);
    };

    setDepth = (buy, sell) => {
        const buySumm = buy.reduce((a, b) => a + +b[1], 0);
        const sellSumm = sell.reduce((a, b) => a + +b[1], 0);
        this.setState({
            buyDepth: +buySumm,
            sellDepth: +sellSumm
        });
    };

    deleteOrder = () => {
        this.setState({ loading: true });
        this.props.deleteOrder(this.state._id)
            .catch(err => {
                this.setState({
                    error: err.response ? err.response.data.error : err.message,
                    loading: false
                })
            });
    };

    showOrder = (price) => {
        this.setState({ loading: true });
        axios.get(`/api/fetch-exist-pair/${this.state.pair}/${this.state.interval}/${this.state._id}`)
            .then(res => {
                let stateObj = {
                    currentPrice: res.data.data[res.data.data.length - 1]['Close'],
                    loading: false
                };
                if(!price) {
                    stateObj.data = res.data.data;
                };
                this.setState(stateObj);
            })
            .catch(err => {
                this.setState({
                    loading: false,
                    error: err.response ? err.repsonse.data.error : err.message
                });
            })
    };

    buyPair = () => {
        this.setState({ loading: true });
        axios.get(`/api/buy-pair/${this.state.pair}/${this.state.interval}/${this.state._id}/${this.state.currentPrice}`)
            .then(res => {
                this.setState({
                    buyPrice: res.data.buyPrice,
                    buyDate: res.data.createdAt,
                    percent: this.calculateClosePercent(this.state.currentPrice, res.data.buyPrice),
                    loading: false
                });
            })
            .catch(err => {
                this.setState({
                    error: err.response ? err.response.data.error : err.message,
                    loading: false
                });
            })
    };

    closeOrder = () => {
        this.setState({ loading: true });
        this.props.closeOrder({
            id: this.state._id,
            interval: this.state.interval,
            pair: this.state.pair,
            buyDate: this.state.buyDate
        })
            .then(res => {
                const profit = this.calculateClosePercent();
                this.setState({ loading: false,
                    closePrice: res.data.closePrice,
                    currentPrice: res.data.closePrice,
                    profit
                })
            })
            .catch(err => {
                this.setState({
                    loading: false,
                    error: err.response ? err.response.data.error : err.message
                })
            })
    };

    calculateClosePercent = (currentPrice = this.state.currentPrice, buyPrice = this.state.buyPrice) => {
        if(!buyPrice) return '';
        let closePercent = calculatePercentProfit(currentPrice, buyPrice);

        if(
            // (closePercent > this.youCanBuyPair) ||
            (closePercent < this.negativePercent)
        ) {
            this.setState({ canBuy: true });
            this.props.setCanBuy(this.props.pair, true);
        }
        // else {
        //     this.setState({ canBuy: false });
        //     this.props.setCanBuy(this.props.pair, false);
        // };

        // if(closePercent < this.negativePercent) {
        //     this.setState({ canBuy: true });
        //     this.props.setCanBuy(this.props.pair, true);
        // } else {
        //     this.setState({ canBuy: false });
        //     this.props.setCanBuy(this.props.pair, false);
        // };
        closePercent = closePercent.toFixed(2) + '%';
        if(parseFloat(closePercent) > 0) closePercent = '+' + closePercent;
        return closePercent;
    };

    // getDepth = () => {
    //     if(this.state.depth) {
    //         this.socket.emit(`get-depth-${this.state.pair}`)
    //     } else {
    //         this.socket.emit(`close-depth-${this.state.pair}`)
    //     };
    //
    // };

    compareProfit = (currentPrice) => {
        if(calculatePercentProfit(+currentPrice, this.state.buyPrice) > 2.5 && this.state.buyed && !this.state.closePrice) {
            // calculatePercentProfit(+currentPrice, trade.buyPrice) < -2)) {
            this.closeOrder();

        }
    };

// Input functions
    onChangeInput = e => {
        this.setState({
            input: {
                ...this.state.input,
                value: e.target.value
            }
        });
    };

    onClickInput = (e) => {
        if(!this.state.input.hidden) {
            return;
        } else {
            this.setState({
                input: {
                    ...this.state.input,
                    hidden: false
                }
            })
        };
    };

    confirmChangingInput = (name) => {
        this.setState({ loading: true });
        axios.post('/api/comment', { id: this.state._id, comment: this.state.input.value })
            .then(() => {
                this.setState({
                    input: {
                        ...this.state.input,
                        hidden: true,
                        fixedValue: this.state.input.value
                    },
                    loading: false
                });
            })
            .catch(err => {
                this.setState({
                    error: err.response ? err.response.data.error : err.message,
                    loading: false
                })
            })

    };

    cancelInputingInput = () => {
        this.setState({
            input: {
                ...this.state.input,
                hidden: true,
                value: this.state.input.fixedValue
            }
        });
    };

    // *************************
    // Limits

    limitFunc = opt => {
        const { order, price } = opt;

        this.setState({
            [order]: price
        })
    };

    //*****************************

    reNewOrder = () => {
        if(!this.state.closePrice) return;
        this.setState({ loading: true });
        axios.get(`/api/renew-order/${this.state._id}/${this.state.pair}/${this.state.interval}`)
            .then(res => {
                const data = res.data._doc;
                this.setState({
                    ...this.initialState,
                    _id: data._id,
                    buyDate: '',
                    buyed: false,
                    buyPrice: '',
                    closePrice: '',
                    buyLimit1: '',
                    buyLimit2: '',
                    buyLimit3: '',
                    takeProfit: '',
                    input: {
                        fixedValue: '',
                        value: '',
                        hidden: true
                    },
                });
            })
            .catch(err => {
                this.setState({
                    loading: false,
                    error: err.response ? err.response.data.error : err.message
                })
            });
    };

    closeCharts = () => {
        const [ chart, macd, seven ] = [ this.chart, this.macdChart, this.sevenEleven ];

        chart.innerHTML = '';
        macd.innerHTML = '';
        seven.innerHTML = '';
        this.setState({ data: [] });
    };

    render() {

        const styleToBuy = {
            backgroundColor: this.state.canBuy && 'blue'
        };

        return (
            <div className="Order" id={this.state.pair}>
                   
                    <div className="main">
                        <div className="uppers">
                            <div className={classnames({
                                btn: true,
                                'btn-success': this.state.signPrice.indexOf('+') === 0 &&
                                Number(this.state.signPrice.replace('%', '')) >= this.youCanBuyPair,
                                'btn-danger': Number(this.state.signPrice.replace('%', '')) <= this.negativePercent
                            })}>{this.state.signPrice}</div>
                            <div className="left">
                                <p>Pair: <span>{this.state.pair}</span></p>
                                <p>Buy price: <span>{this.state.buyPrice || 'Not buyed yet'}</span></p>
                                <p>Current price: <span>{this.state.currentPrice || 'No current price'}</span></p>
                                <p>Interval: <span>{this.state.interval || 'No interval'}</span></p>
                                <p>Buy time: <span>{this.state.buyDate || 'Not buyed yet'}</span></p>
                                <p>Start time: <span>{this.state.startTime || 'Not started yet???'}</span></p>
                                <div>Local minimum:
                                    <p style={{ margin: '0 0 0 10px' }}>Price: {this.state.localMin.price}</p>
                                    <p style={{ margin: '0 0 0 10px' }}>Position: {this.state.localMin.position}</p>
                                </div>
                            </div>

                            <div className="middle">
                                <Depth
                                    buyDepth={this.state.buyDepth}
                                    sellDepth={this.state.sellDepth}
                                />
                            </div>

                            <div className="right">
                                <Input
                                    style={{
                                        flexDirection: 'column',
                                        margin: 0,
                                        width: '100%',
                                        height: '100%'
                                     }}
                                    textarea={true}
                                    value={this.state.input.value}
                                    name={this.state.pair}
                                    label={`Comments to ${this.state.pair}`}
                                    hidden={this.state.input.hidden}
                                    disabled={this.state.loading}
                                    onChange={this.onChangeInput}
                                    onClick={this.onClickInput}
                                    confirmChanging={this.confirmChangingInput}
                                    fixedValue={this.state.input.fixedValue}
                                    cancelInputing={this.cancelInputingInput}
                                />
                            </div>
                        </div>

                        <Limits
                            pair={this.state.pair}
                            loading={this.state.loading}
                            id={this.state._id}
                            takeProfit={this.state.takeProfit}
                            buyLimit1={this.state.buyLimit1}
                            buyLimit2={this.state.buyLimit2}
                            buyLimit3={this.state.buyLimit3}
                            limitFunc={this.limitFunc}
                        />



                    
                        <button className="btn-btn-primary" onClick={this.getDepth}>Get depth</button>
                        <button className='btn btn-primary'
                                disabled={this.props.loading || this.state.loading} onClick={this.deleteOrder}>Delete order</button>
                        <button className='btn btn-success'
                                disabled={this.props.loading || this.state.loading}
                                onClick={() => this.state.data.length < 1 ? this.showOrder(false) : this.closeCharts()}
                                //onClick={this.drawAllCharts}
                        >
                            { this.state.data.length < 1 ? 'Get order data' : 'Close charts' }
                        </button>
                        <button className="btn btn-success"
                                style={{  width: '30%' }}
                                disabled={this.state.loading || !!this.state.buyPrice} 
                                onClick={this.buyPair}>
                            {!this.state.buyPrice ?
                            `Buy - ${this.state.pair} - ${this.state.currentPrice}` :
                            `Was bought on ${this.state.buyPrice}`
                        }
                        </button>
                        <button className="btn btn-danger" 
                                disabled={this.state.loading || !!this.state.closePrice || !this.state.buyPrice}
                                onClick={this.closeOrder}>
                            {!!this.state.closePrice ?
                                `Closed on ${this.state.closePrice}: ${this.state.profit}`:
                                `Close order ${this.state.percent || ''}`}
                        </button>
                        <button className="btn btn-primary"
                                disabled={this.state.loading || !this.state.closePrice || !this.state.buyPrice}
                                onClick={this.reNewOrder}
                        >
                            Renew order
                        </button>
                        {this.state.error && <div className="error">{this.state.error}</div>}
                    </div>
                <div className="chart" ref={node => this.chart = node}></div>
                <div className="wrapper-sevenEleven">
                    <div className="sevenEleven" ref={node => this.sevenEleven = node}></div>
                </div>
                <div className="chart" ref={node => this.macdChart = node}></div>

            </div>
        );
    };
};

