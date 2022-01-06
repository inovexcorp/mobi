/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { Component } from "@angular/core";
import { SpinnerService } from "./spinner.service";

/**
 * @class AppComponent
 * 
 * Main component for the Mobi application. Currently just contains a MatSpinner that is displayed if there are any
 * pending HTTP requests coming from Angular code.
 */
@Component({
    selector: 'mobi-app',
    template: `
        <div *ngIf="ss.pendingRequests > 0" class="app-spinner-container"><mat-spinner class="app-spinner" diameter="50"></mat-spinner></div>
    `
})
export class AppComponent {
    constructor(public ss: SpinnerService) {}
}
