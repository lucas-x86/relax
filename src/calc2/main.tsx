/*** Copyright 2018 Johannes Kessler
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import 'bootstrap/dist/css/bootstrap.css';
import { I18NProvider } from 'calc2/i18n';
import { Store } from 'calc2/store';
import * as React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';

const ConnectedCalc = React.lazy(() => import('./views/calc').then(m => ({ default: m.ConnectedCalc })));

import 'calc2/style/index.scss';


type Props = {
	store: Store,
};

type State = {
	isNavbarOpen: boolean,
};


export class Main extends React.Component<Props, State> {
	

	
	constructor(props: Props) {
		super(props);
		this.state = {
			isNavbarOpen: true,
		};
	}
		
	
	componentDidMount(){
		const element = document.getElementById('loadingScreen');
		element?.parentNode?.removeChild(element);
	}

	render() {
		const { store } = this.props;
		const { isNavbarOpen } = this.state;

		return (
			<Router>
				<Provider store={store}>
					<I18NProvider>
						<React.Suspense fallback={<div className="center"><div className="spinnerInit"></div></div>}>
							<Switch>
								<Redirect exact from="/" to={`/calc`} />
								<Redirect from="/calc" to="/calc/local/starter/local/0" exact strict />
								<Route path="/calc/:source/:id/:filename/:index" component={ConnectedCalc} />
								<Route path="/calc/:source/:id" component={ConnectedCalc} />
								<Route render={match => (
									<div className="view-min"><h1>404</h1>
										<p>This route doesn't exist</p>
										<span>{JSON.stringify(match)}</span>
									</div>
								)} />
							</Switch>
						</React.Suspense>
					</I18NProvider>
				</Provider>
			</Router>
		);
	}
}
