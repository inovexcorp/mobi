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

import { catchError, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { get } from 'lodash';
import { forkJoin, from, Observable, of, Subject, throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { CatalogManagerService } from './catalogManager.service';
import { CatalogStateService } from './catalogState.service';
import { DatasetManagerService } from './datasetManager.service';
import { DatasetStateService } from './datasetState.service';
import { DelimitedManagerService } from './delimitedManager.service';
import { DiscoverStateService } from './discoverState.service';
import { MapperStateService } from './mapperState.service';
import { MergeRequestsStateService } from './mergeRequestsState.service';
import { OntologyManagerService } from './ontologyManager.service';
import { ShapesGraphStateService } from './shapesGraphState.service';
import { StateManagerService } from './stateManager.service';
import { UserManagerService } from './userManager.service';
import { UserStateService } from './userState.service';
import { YasguiService } from './yasgui.service';
import { OntologyStateService } from './ontologyState.service';
import { REST_PREFIX } from '../../constants';
import { ToastService } from './toast.service';
import { ProvManagerService } from './provManager.service';
import { createHttpParams } from '../utility';
import { EventWithPayload } from '../models/eventWithPayload.interface';

/**
 * @class shared.LoginManagerService
 *
 * A service that provides access to the Mobi login REST endpoints so users can log into and out of Mobi.
 */
@Injectable()
export class LoginManagerService {
    prefix = `${REST_PREFIX}session`;
    weGood = false;

    private _loginManagerActionSubject = new Subject<EventWithPayload>();
    public loginManagerAction$ = this._loginManagerActionSubject.asObservable();

    constructor(private http: HttpClient, private router: Router,
        private cm: CatalogManagerService,
        private cs: CatalogStateService, private dm: DatasetManagerService,
        private ds: DatasetStateService, private dlm: DelimitedManagerService,
        private dis: DiscoverStateService, private ms: MapperStateService,
        private mrs: MergeRequestsStateService, private om: OntologyManagerService,
        private os: OntologyStateService, private sgs: ShapesGraphStateService,
        private sm: StateManagerService, private um: UserManagerService,
        private us: UserStateService, private toast: ToastService, private yasgui: YasguiService, 
        private prov: ProvManagerService) {}
    
    /**
     * `currentUser` holds the username of the user that is currently logged into Mobi.
     * @type {string}
     */
    currentUser = '';

    /**
     * `currentUserIRI` holds the IRI of the user that is currently logged into Mobi.
     * @type {string}
     */
    currentUserIRI = '';

    /**
     * Makes a call to POST /mobirest/session to attempt to log into Mobi using the passed credentials. Returns a
     * Promise with the success of the log in attempt. If failed, contains an appropriate error message.
     *
     * @param {string} username the username to attempt to log in with
     * @param {string} password the password to attempt to log in with
     * @return {Observable} An Observable that resolves if the log in attempt succeeded and rejects
     * with an error message if the log in attempt failed
     */
    login(username: string, password: string): Observable<boolean> {
        const params = { username, password };
        return this.http.post(this.prefix, null, {params: createHttpParams(params), responseType: 'text', observe: 'response'}).pipe(
            switchMap(response => {
                if (response.status === 200 && response.body) {
                    this.currentUser = response.body;
                    if (get(response.headers, 'accounts-merged', false) === 'true') {
                        this.toast.createWarningToast('Local User Account found. Accounts have been merged.');
                    }
                    return from(this.um.getUser(this.currentUser))
                        .pipe(
                            map(user => {
                                this.currentUserIRI = user.iri;
                                this.currentUser = user.username;
                                this.router.navigate(['/home']);
                                return true;
                            }),
                            catchError(() => of(false))
                        );
                }
            }),
            catchError(response => {
                if (response.status === 401) {
                    return throwError('This email/password combination is not correct.');
                } else {
                    return throwError('An error has occurred. Please try again later.');
                }
            })
        );
    }

    /**
     * Makes a call to DELETE /mobirest/session to log out of which ever user account is current. Navigates back to
     * the login page.
     */
    logout(): void {
        this._loginManagerActionSubject.next({eventType: 'LOGOUT', payload: {
            currentUserIRI: this.currentUserIRI,
            currentUser: this.currentUser
        }});
        this.weGood = false;
        this.ds.reset();
        this.dlm.reset();
        this.dis.reset();
        this.ms.initialize();
        this.ms.resetEdit();
        this.mrs.reset();
        this.os.reset();
        this.sgs.reset();
        this.cs.reset();
        this.yasgui.reset();
        this.prov.reset();
        this.http.delete(this.prefix)
            .subscribe(() => {
                this.currentUser = '';
                this.currentUserIRI = '';
                this.us.reset();
                this.router.navigate(['/login']);
            });
    }

    /**
     * Test whether a user is currently logged in and if not, navigates to the log in page. If a user
     * is logged in, initializes the {@link shared.CatalogManagerService}, {@link shared.CatalogStateService},
     * {@link shared.MergeRequestsStateService}, {@link shared.OntologyManagerService},
     * {@link shared.OntologyStateService}, {@link shared.DatasetManagerService}, {@link shared.StateManagerService},
     * and the {@link shared.UserManagerService}. Returns an Observable with whether or not a user is logged in.
     *
     * @return {Observable} An Observable that resolves if a user is logged in and rejects with the HTTP
     * response data if no user is logged in.
     */
    isAuthenticated(): Observable<boolean> {
        return this.getCurrentLogin().pipe(
            switchMap((data: string) => {
                if (!data) {
                    return throwError(data);
                }
                let requests = [
                    this.sm.initialize(),
                    this.um.initialize(),
                    this.um.getUser(data).pipe(tap(user => {
                        this.currentUserIRI = user.iri;
                        this.currentUser = user.username;
                    }))
                ];
                if (!this.weGood) {
                    requests = requests.concat([
                        this.cm.initialize().pipe(tap(() => {
                            this.cs.initialize();
                            this.mrs.initialize();
                            this.om.initialize();
                            this.os.initialize();
                            this.sgs.initialize();
                            this.prov.initialize();
                        })),
                        this.dm.initialize()
                    ]);
                }
                if (this.checkMergedAccounts()) {
                    this.toast.createWarningToast('Local User Account found. Accounts have been merged.');
                }

                return forkJoin(requests);
            }),
            mergeMap(() => {
                this.weGood = true;
                return of(true);
            }),
            catchError(() => {
                this.currentUser = '';
                this.currentUserIRI = '';
                return of(false);
            })
        );
    }

    /**
     * Makes a call to GET /mobirest/session to retrieve the user that is currently logged in. Returns a Promise
     * with the result of the call.
     *
     * @return {Observable} An Observable with the response data that resolves if the request was successful; rejects if
     * unsuccessful
     */
    getCurrentLogin(): Observable<string> {
        return this.http.get(this.prefix, {observe: 'response', responseType: 'text'}).pipe(
            catchError(error => throwError(error.statusText)),
            switchMap(response => {
                if (response.status === 200) {
                    return of(response.body);
                } else {
                    return throwError(response.body);
                }
            })
        );
    }

    /**
     * Takes the current url of the window and parses the string for path params that are preceded by a question mark.
     * If a path param for the merged-account flag is present it returns the value of the flag. If the flag is not
     * present, it returns false.
     *
     * @return {boolean} A boolean value representing whether a local account and a remote account were merged or not.
     */
    checkMergedAccounts(): boolean {
        const url = window.location.href;
        let merged = false;
        const queryParams = url.split('?');
        queryParams.forEach(param => {
            if (param && param.includes('merged-accounts')) {
                merged = param.split('=')[1] === 'true' ? true : false;
                return;
            }
        });
        return merged;
    }
}
