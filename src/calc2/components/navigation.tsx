/*** Copyright 2018 Johannes Kessler
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Navbar, NavbarBrand } from 'reactstrap';

type Props = {

};

type State = {};

export class Navigation extends React.Component<Props, State> {
	
    constructor(props: Props) {
        super(props);
        this.state = {};
	}


	render() {
        return (
            <Navbar color="light" light expand="md" className="desktopNavbar">
                <NavbarBrand>ReluX</NavbarBrand>
            </Navbar>
        );
    }
}
