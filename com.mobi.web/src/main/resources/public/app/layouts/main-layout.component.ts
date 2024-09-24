/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { SseService } from '../shared/services/sse.service';

/**
 * @class MainLayoutComponent
 * 
 * @description 
 * `MainLayoutComponent` is a component that renders the main layout of the application after logging in.
 * It includes a sidebar and a router-outlet.
 */
@Component({
  selector: 'main-layout',
  template: `
    <div class="h-100" [ngClass]="{'collapsed-nav': collapsedNav}">
        <div class="container-fluid h-100">
            <div class="row flex-nowrap h-100">
                <sidebar [(collapsedNav)]="collapsedNav"></sidebar>
                <section class="col app-container h-100">
                    <router-outlet></router-outlet>
                </section>
            </div>
        </div>
    </div>
  `,
  styles: []
})
export class MainLayoutComponent implements OnDestroy {
  /**
   * This property determines whether the sidebar is collapsed or not.
   * 
   * @type {boolean}
   * @default false
   */
  collapsedNav = false;
  
  /**
   * This is the constructor for the main layout component that starts the listener for Server-Sent Events.
   * @param {Router} router - The Angular router service.
   * @param {SseService} _sse - The SSEService instance used for Server-Sent Events.
   */
  constructor(public router: Router, private _sse: SseService) {
    this._sse.initializeEvents();
  }

  /**
   * Stops the Server-Sent Events on component destroy.
   */
  ngOnDestroy(): void {
    this._sse.stopEvents();
  }
}
