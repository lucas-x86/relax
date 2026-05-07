/*** Copyright 2018 Johannes Kessler
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { i18n, T } from 'calc2/i18n';
import * as store from 'calc2/store';
import { Group, GROUPS_LOAD_REQUEST, HeaderTranslated } from 'calc2/store/groups';
import { translateHeader } from 'calc2/utils/misc';
import classNames from 'classnames';
import * as Immutable from 'immutable';
import memoize from 'memoize-one';
import * as React from 'react';
import { connect } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { open as openDialog } from '@tauri-apps/plugin-dialog';

type Props = {
	groups: store.State['groups']['groups'],
	current: store.State['groups']['current']
	locale: store.State['session']['locale'],
	loadGroupTab: Function,
	datasetLoaded: Function,
	loadFile: (path: string) => void,
};


export class Menu extends React.Component<Props> {

	private getGroupsByHeadlineName = memoize((groups: Props['groups'], locale: string) => {
		let groupsByHeadlineName = Immutable.OrderedMap<string | null, Group[]>();

		const t = (x: HeaderTranslated) => translateHeader(x, locale);

		// collect all groups and group them by group-name
		for (const group of groups.values()) {
			let category: string | null = null;

			if (group.isDraft === true) {
				category = i18n.t('calc.maintainer-groups.temp');
			}
			else if (group.category) {
				category = t({lang: '', fallback: group.groupInfo.maintainerGroup});
			}

			const groups = [
				...(groupsByHeadlineName.get(category) || []),
				group,
			];
			groups.sort((a, b) => t(a.groupName).localeCompare(t(b.groupName)));

			groupsByHeadlineName = groupsByHeadlineName.set(category, groups);
		}

		return groupsByHeadlineName;
	});

	private async openFromFile() {
		try {
			const selected = await openDialog({
				multiple: false,
				directory: false,
				filters: [{ name: 'RelaX dataset', extensions: ['txt'] }],
			});
			if (typeof selected === 'string' && selected.length > 0) {
				this.props.loadFile(selected);
				this.props.datasetLoaded();
			}
		}
		catch (e) {
			console.error('failed to open file', e);
		}
	}

	render(): JSX.Element {
		const { current, locale } = this.props;
		const groupsByHeadlineName = this.getGroupsByHeadlineName(this.props.groups, locale);

		return (
			<div className="container">
				<div className="row">
					<div className="col-md-6">
						<h4><T id="calc.menu.headline" /></h4>

						<ul id="groups-selector-list">
							{groupsByHeadlineName.map((groups: any, headline: any) => (
								<li key={`${headline}`}>
									{!headline ? <T id="calc.maintainer-groups.misc" /> : headline}
									<ul>
										{groups.map((group: any) => {
											const { groupName, groupInfo } = group;
											const path = `/calc/${groupInfo.source}/${groupInfo.id}/${groupInfo.filename}/${groupInfo.index}`;

											return (
												<li key={path} className={classNames({
													active: current && current.group.groupInfo === group.groupInfo,
												})}>
													<NavLink to={path} onClick={() => { this.props.datasetLoaded(); }}>{translateHeader(groupName, locale)}</NavLink>
												</li>
											);
										})}
									</ul>
								</li>
							)).valueSeq().toArray()}
						</ul>
					</div>
					<div className="col-md-6 align-text-top align-top">
						<h4>Abrir arquivo</h4>
						<p>Carregar um dataset RelaX a partir de um arquivo <code>.txt</code> no disco.</p>
						<button type="button" className="fullWidthBtn btn btn-secondary" onClick={() => this.openFromFile()}>
							<i className="fa fa-folder-open-o fa-lg"></i> <span>Selecionar arquivo…</span>
						</button>

						<hr />
						<h4><T id="calc.menu.create-own-dataset-headline" /></h4>
						<p><T id="calc.menu.create-own-dataset-text" /></p>
						<button type="button" className="fullWidthBtn btn btn-secondary open-group-new-btn" onClick={() => { this.props.loadGroupTab(false); }}>
							<i className="fa fa-plus-square-o fa-lg"></i> <span><T id="calc.menu.create-own-dataset-button-new" /></span>
						</button>
						<button type="button" className="fullWidthBtn btn btn-secondary open-group-current-btn" onClick={() => { this.props.loadGroupTab(true); }}>
							<i className="fa fa-pencil-square-o fa-lg"></i> <span><T id="calc.menu.create-own-dataset-button-modify" /></span>
						</button>
					</div>
				</div>
			</div>
		);
	}
}

export const MenuConnected = connect((state: store.State) => {
	return {
		groups: state.groups.groups,
		current: state.groups.current,
		locale: state.session.locale,
	};
}, (dispatch) => {
	return {
		loadFile: (path: string) => {
			const action: GROUPS_LOAD_REQUEST = {
				type: 'GROUPS_LOAD_REQUEST',
				source: 'file',
				id: path,
				maintainer: '',
				maintainerGroup: '',
				setCurrent: 'first',
			};
			dispatch(action);
		},
	};
})(Menu);
