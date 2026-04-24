/*** Copyright 2018 Johannes Kessler
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { SET_LOCALE } from 'calc2/store/session';
import 'custom-event-polyfill';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { i18n } from './i18n';
import { Main } from './main';
import { store } from './store';



ReactDOM.render(
	(
		<Main store={store} />
	),
	document.getElementById('root'),
);

// init
setTimeout(() => {
	const action: SET_LOCALE = {
		type: 'SET_LOCALE',
		locale: i18n.language,
	};
	store.dispatch(action);

}, 0);
