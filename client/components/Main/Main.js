import { connect } from 'react-redux';
import { findDOMNode } from 'react-dom';
import { Link } from 'react-router-dom';

import axios from 'axios';

import { getCandleData, fetchPairsData, launcnBot } from '../../actions/pairsAPI';

import dataClient from '../common/data';
import { exponentialMovingAverage, signalMACD, macdCalculate, simpleMA } from '../../../server/common/ema';

import Option from '../common/Option/Option';

import './Main.sass';

function mapState(state) {
    return {
        pairs: state.pairs.pairs,
        dataPair: state.pairs.data || [],
        botData: state.botData,
        globalError: state.globalError
    };
};

@connect(mapState, { getCandleData, fetchPairsData, launcnBot })
export default class Main extends React.Component {
    constructor(props) {
        super(props);

        this.initialChosePair = {
            name: '--Choose pair--',
            title: ''
        };

        this.state = {
            error: this.props.globalError || '',
            pairs: [],
            chosenPair: this.initialChosePair,
            chosenTimeFrame: '30m',
            limit: 50,
            loading: false,
            loadingPairs: false
        };
    };

    componentDidMount() {
        if(this.state.pairs.length < 1) {
            if(this.props.pairs.length > 0) {
                this.setState({
                    pairs: this.props.pairs
                        .filter(item => isNaN(+item))
                        .map(item => { return { name: item, title: item } })
                })
            } else {
                this.setState({ loadingPairs: true });
                this.props.fetchPairsData()
                    .then(() => this.setState({ loadingPairs: false }))
                    .catch(err => {
                        this.setState({
                            loadingPairs: false,
                            error: err
                        });
                    })
            }
        };
    };

    componentDidUpdate(prevProps, prevState) {
        if(this.props.globalError !== prevProps.globalError) {
            this.setState({
                error: this.props.globalError
            });
        };

        if(this.props.pairs !== prevProps.pairs) {
            // console.log(this.props.pairs)
            // const pairs = this.props.pairs.map(item => {
            //     let symbol = item.symbol;
            //     if(!isNaN(+symbol)) return null;
            //     if(symbol.length > 6) {
            //         return {
            //             title: symbol,
            //             name: `${symbol.slice(0, symbol.length - 3)} / ${symbol.slice(symbol.length - 4, -1)}`
            //         }
            //     } else {
            //         return {
            //             title: symbol,
            //             name: `${symbol.slice(0, 3)} / ${symbol.slice(3)}`
            //         }
            //     };
            // }).filter(item => !!item).sort((a, b) => {
            //     if(a.title < b.title) {
            //         return -1
            //     } else if(a.title > b.title) {
            //         return 1
            //     } else {
            //         return 0
            //     }
            // });
            this.setState({ pairs: this.props.pairs.filter(item => isNaN(+item)).map(item => { return { title: item, name: item } }) });
        };

        if(this.props.dataPair !== prevProps.dataPair) {
            google.charts.load('current', {'packages':['corechart']});
            // google.charts.setOnLoadCallback(this.drawChart);
            google.charts.setOnLoadCallback(this.drawLineChart);

            google.charts.load('current', {packages: ['corechart', 'line']});
            google.charts.setOnLoadCallback(this.drawMacdChart);
            google.charts.setOnLoadCallback(this.drawSeveElevenChart);
        };

        if(this.props.botData !== prevProps.botData) {
            // google.charts.load('current', {packages: ['corechart', 'line']});
            // google.charts.setOnLoadCallback(this.drawBotData);
        };
    };

    drawSeveElevenChart = () => {
        const dataEma = this.props.dataPair.map(item => {
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
            width: '100%',
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

    drawBotData = () => {
        this.props.botData.forEach(item => {
            let dataColumns = [['Time', 'MACD', 'Signal']];
            item.data.forEach(data => {
                let elem = [data['time'], data.macd || 0, data.signal || 0];
                dataColumns.push(elem);
            });
            const data = google.visualization.arrayToDataTable(dataColumns);
            let options = {
                colors: ['#a52714', '#0f9d58'],
                title: item.pair,
                width: 800,
                height : 200
            };
            const formatter = new google.visualization.NumberFormat({
                fractionDigits: 8
            });
            const div = document.createElement('div');
            div.classList.add(item.pair);
            const pasteElem = findDOMNode(this).append(div);
            let chart = new google.visualization.LineChart(document.getElementsByClassName(item.pair)[0]);
            formatter.format(data, 1);
            formatter.format(data, 2);
            chart.draw(data, options);
        });
    };

    drawLineChart = () => {
        const dataEma = this.props.dataPair.map(item => {
            return {
                time: item['Open time'],
                price: item['Close']
            };
        });

        let dataColumns = [['Time', 'Price']];
        dataEma.forEach(item => {
            let elem = [item['time'], item.price];
            dataColumns.push(elem);
        });
        const data = google.visualization.arrayToDataTable(dataColumns);

        let options = {
            title: this.state.chosenPair.title,
            colors: ['#a52714', '#0f9d58'],
            width: 800,
            height : 200
        };

        const formatter = new google.visualization.NumberFormat({
            fractionDigits: 8
        });

        let chart = new google.visualization.LineChart(this.pairData);
        formatter.format(data, 1);
        chart.draw(data, options);
    };

    drawMacdChart = () => {
        const dataEma = this.props.dataPair.map(item => {
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

        let chart = new google.visualization.LineChart(this.ema);
        formatter.format(data, 1);
        formatter.format(data, 2);
        chart.draw(data, options);
    };

    drawChart = () => {
        const arr = this.props.dataPair.map(item => {
            return [
                item['Open time'].split('T')[1].split(':').slice(0,2).join(':'),
                { v: item['Low'], f: item['Low'].toFixed(8) },
                { v: item['Open'], f: item['Open'].toFixed(8) },
                { v: item['Close'], f: item['Close'].toFixed(8) },
                { v: item['High'], f: item['High'].toFixed(8) },
                // `Open ${item['Open']} - Close ${item['Close']} : Low ${item['Low']} - High ${item['High']}`
            ]
        });
        let data = google.visualization.arrayToDataTable(arr, true);
        // var data = new google.visualization.DataTable();
        // data.addColumn('string', 'Time');
        // data.addColumn('number', 'Price');
        // data.addColumn({type: 'string', role: 'tooltip'});
        let options = {
            title: this.state.chosenPair.name,
            legend: 'none',
            bar: { groupWidth: '100%' }, // Remove space between bars.
            candlestick: {
                fallingColor: { strokeWidth: 1, fill: '#a52714', stroke: '#a52714' }, // red
                risingColor: { strokeWidth: 1, fill: '#0f9d58', stroke: '#0f9d58' }   // green
            },
            tooltip: {
                ignoreBounds: true
            },
            width: '100%',
            height : 700
        };

        let chart = new google.visualization.CandlestickChart(this.pairData );

        google.visualization.events.addListener(chart, 'select', e => {
            const {row, column} = chart.getSelection()[0];
            console.log(data.getValue(row, column))
        })

        chart.draw(data, options);
    };

    getCandleData = () => {
        this.setState({
            loading: true,
            error: ''
        });
        this.props.getCandleData(this.state.chosenPair.title, this.state.chosenTimeFrame, this.state.limit)
            .then(() => {
                this.setState({
                    loading: false
                })
            })
            .catch(err => this.setState({loading: false, error: err}))
    };

    choosePair = title => {
        this.setState({
            chosenPair: this.state.pairs.find(item => item.title === title)
        });
    };

    chooseTimeFrame = title => {
        this.setState({
            chosenTimeFrame: dataClient.timeframes.find(item => item === title)
        });
    };

    onChangeLimit = e => {
        const value  = +e.target.value;
        if(isNaN(value)) return;
        if(value > 500) return;
        this.setState({ limit: value });
        if(value < 1) this.setState({ limit: 1 });
    };

    launchBot = () => {
        this.drawBotData.innerHtml = '';
        this.setState({ loading: true })
        this.props.launcnBot(this.state.chosenTimeFrame)
            .then(() => this.setState({ loading: false }))
            .catch(err => {
                this.setState({ loading: false, error: err })
                console.log(err)
            })
        // this.setState({ loading: true })
        // axios.post('/api/rabbit-pair', { interval: this.state.chosenTimeFrame, limit: 50 })
    };

    startBot = () => {
        this.setState({ loading: true });
        axios.get(`/api/start-bot/${this.state.chosenTimeFrame}`)
            .then(() => {
                this.setState({ loading: false })
            })
            .catch(err => {
                this.setState({
                    error: err.response ? err.response.data.error : err.message,
                    loading: false
                });
            });
    };

    render() {
        return (
            <div className='Main'>
                {this.state.error && <div className="error">{this.state.error}</div>}
                <button
                    className='btn btn-primary'
                    disabled={this.state.chosenPair.title === this.initialChosePair.title || this.state.loading}
                    onClick={this.getCandleData}
                >
                    Get candle data
                </button>

                <button className='btn btn-primary' onClick={this.launchBot}>Launch bot</button>
                <button className='btn btn-danger' onClick={this.startBot}>START BOT</button>
                <Link className='btn btn-primary' to='/show-orders'>Show active orders</Link>

                {this.state.loading && <div className="loading">Loading...</div>}

                <div className="options">
                    <Option
                        items={this.state.pairs.sort((a, b) => {
                            if(a.name > b.name) {
                                return 1;
                            } else if(a.name < b.name) {
                                return -1;
                            } else {
                                return 0
                            }
                        })}
                        label='Choose crypto pair'
                        value={this.state.chosenPair.name}
                        loading={this.state.loadingPairs}
                        disable={this.state.loading}
                        loadingValue='Loading pairs...'
                        emptyValue='Some error cause no pair'
                        onClick={this.choosePair}
                    />

                    <Option
                        items={dataClient.timeframes.map(item => { return { title: item, name: item } })}
                        label='Choose interval'
                        value={this.state.chosenTimeFrame}
                        loading={false}
                        disable={this.state.loading}
                        loadingValue='Loading limits...'
                        emptyValue='Some error cause no choose variables'
                        onClick={this.chooseTimeFrame}
                    />
                </div>

                <div className="input-limit">
                    <label htmlFor="input-limit">Select limit</label>
                    <input
                        id='input-limit'
                        type="text"
                        placeholder='Type the limit rate(min 1 max 500)...'
                        onChange={this.onChangeLimit}
                        value={this.state.limit}
                    />
                </div>

                <div className="pairs" ref={node => this.pairData = node} style={{marginTop: 30, width: 800}}></div>

                <div className="ema" ref={node => this.ema = node} style={{ width: 800 }}></div>

                <div className="ema" ref={node => this.sevenEleven = node} style={{ width: 800 }}></div>
            </div>

        )
    };
};