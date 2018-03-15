import { Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';

import NotFoundPage from '../404/404';
import Main from '../Main/Main';
import Orders from '../Orders/Orders';
import Result from '../Result/Result';

import './App.sass';


class App extends React.Component {
    render() {
        return (
            <div className="App">
                <Result />
                <Switch>
                    <Route exact path="/" component={Main}/>
                    <Route exact path="/show-orders" component={Orders}/>

                    <Route component={NotFoundPage} />
                </Switch>
            </div>
        );
    }
}

export default App;

