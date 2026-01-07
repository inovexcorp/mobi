/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { CatalogManagerService } from './catalogManager.service';
import { CatalogStateService } from './catalogState.service';
import { createHttpParams } from '../utility';
import { DatasetManagerService } from './datasetManager.service';
import { DatasetStateService } from './datasetState.service';
import { DelimitedManagerService } from './delimitedManager.service';
import { DiscoverStateService } from './discoverState.service';
import { EntitySearchStateService } from '../../entity-search/services/entity-search-state.service';
import { EventWithPayload } from '../models/eventWithPayload.interface';
import { MapperStateService } from './mapperState.service';
import { MergeRequestsStateService } from './mergeRequestsState.service';
import { OntologyManagerService } from './ontologyManager.service';
import { OntologyStateService } from './ontologyState.service';
import { ProvManagerService } from './provManager.service';
import { REST_PREFIX } from '../../constants';
import { ShapesGraphStateService } from './shapesGraphState.service';
import { StateManagerService } from './stateManager.service';
import { ToastService } from './toast.service';
import { User } from '../models/user.class';
import { UserManagerService } from './userManager.service';
import { UserStateService } from './userState.service';
import { YasguiService } from './yasgui.service';

/**
 * @class shared.LoginManagerService
 *
 * A service that provides access to the Mobi login REST endpoints so users can log into and out of Mobi.
 */
@Injectable()
export class LoginManagerService {
  readonly NO_TOKEN_MESSAGE = 'No authentication token detected, redirecting back to login page.';
  readonly TOKEN_EXPIRED_MESSAGE = 'Authentication token is expired, redirecting back to login page.';
  readonly SESSION_INVALID_MESSAGE = 'Authentication session is invalid, redirecting back to login page.';
  /**
   * The REST API prefix for session-related endpoints.
   * @type {string}
   */
  prefix = `${REST_PREFIX}session`;
  /**
   * A flag indicating whether the application is in a good state after service initialization.
   * @type {boolean}
   */
  weGood = false;
  /**
   * Holds the username of the user currently logged into the application.
   * @type {string}
   */
  currentUser = '';
  /**
   * Holds the IRI (Internationalized Resource Identifier) of the user currently logged into the application.
   * @type {string}
   */
  currentUserIRI = '';
  /**
   * A subject to emit actions related to login management.
   * This observable is used to notify subscribers of login-related events.
   * @type {Subject<EventWithPayload>}
   */
  private _loginManagerActionSubject: Subject<EventWithPayload> = new Subject<EventWithPayload>();
  /**
   * An observable that emits login management actions (e.g., logout events).
   * @type {Observable<EventWithPayload>}
   */
  public loginManagerAction$: Observable<EventWithPayload> = this._loginManagerActionSubject.asObservable();

  constructor(private http: HttpClient, private router: Router,
    private cm: CatalogManagerService,
    private cs: CatalogStateService, 
    private dis: DiscoverStateService, 
    private dlm: DelimitedManagerService,
    private dm: DatasetManagerService,
    private ds: DatasetStateService, 
    private ess: EntitySearchStateService,
    private mrs: MergeRequestsStateService, 
    private dialog: MatDialog,
    private ms: MapperStateService,
    private om: OntologyManagerService,
    private os: OntologyStateService, 
    private prov: ProvManagerService,
    private sgs: ShapesGraphStateService,
    private sm: StateManagerService, 
    private toast: ToastService, 
    private um: UserManagerService,
    private us: UserStateService, 
    private yasgui: YasguiService
  ) {
  }

  /**
   * Makes a call to POST /mobirest/session to attempt to log into Mobi using the passed credentials. Returns an
   * Observable with the success of the log in attempt. If failed, contains an appropriate error message.
   *
   * @param {string} username the username to attempt to log in with
   * @param {string} password the password to attempt to log in with
   * @return {Observable} An Observable that resolves if the log in attempt succeeded and rejects
   * with an error message if the log in attempt failed
   */
  login(username: string, password: string): Observable<boolean> {
    const fd = new HttpParams()
      .set('username', username)
      .set('password', password);
    return this.http.post(this.prefix, fd, {
      responseType: 'text',
      observe: 'response',
      headers: new HttpHeaders({'Content-Type': 'application/x-www-form-urlencoded'})
    }).pipe(
      switchMap(response => {
        if (response.status === 200 && response.body) {
          this.currentUser = response.body;
          if (get(response.headers, 'accounts-merged', false) === 'true') {
            this.toast.createWarningToast('Local User Account found. Accounts have been merged.');
          }
          return from(this.um.getUser(this.currentUser))
            .pipe(
              map((user: User) => {
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
    this.http.delete(this.prefix)
      .subscribe(() => {
        this.clearServiceStates();
        this.router.navigate(['/login']);
      });
  }

  /**
   * Clears the states of various services and resets login-related properties.
   */
  clearServiceStates(): void {
    this.weGood = false;
    this._loginManagerActionSubject.next({
      eventType: 'LOGOUT', payload: {
        currentUserIRI: this.currentUserIRI,
        currentUser: this.currentUser
      }
    });
    this.currentUser = '';
    this.currentUserIRI = '';
    // Reset Services
    this.us.reset();
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
    this.ess.reset();
    this.deleteCookie('mobi_web_token');
  }

  /**
   * Test whether a user is currently logged in and if not, navigates to the log in page.
   * Checks the authentication status of the current user by performing several initialization 
   * tasks and retrieving user data.
   * 
   * @returns {Observable<boolean>} An observable that emits true if the user is authenticated 
   *          and all services are initialized, or false if an error occurs or the user data is unavailable.
   */
  isAuthenticated(): Observable<boolean> {
    return this.getCurrentLogin().pipe(
      switchMap((username: string) => {
        if (!username) {
          return throwError(username);
        }
        let requests = [
          this.sm.initialize(),
          this.um.initialize(),
          this.um.getUser(username).pipe(tap(user => {
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
        this.clearServiceStates();
        return of(false);
      })
    );
  }

  /**
   * Makes a call to GET /mobirest/session to retrieve the user that is currently logged in.
   * 
   * @returns {Observable<string>} An observable that emits the current login username as a string
   *          if the request is successful, or throws an error if the request fails or returns
   *          an unexpected status.
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

  /**
   * Validates the user's authentication token and session.
   * If the token is missing, expired, or the session is invalid, 
   * the user is redirected to the login page and an error message is displayed.
   *
   * This method performs the following checks:
   * - Verifies if the 'mobi_web_token' cookie exists.
   * - Decodes and checks if the JWT token has expired.
   * - Confirms if the session is authenticated.
   *
   * @param showToast - A boolean flag to determine if a toast message should be shown on validation result (default is true).
   * @returns Observable<boolean> Emits 'true' if the session is valid, otherwise 'false'.
   */
   validateSession(showToast = true): Observable<boolean> {
    return of(this.getCookie('mobi_web_token')).pipe(
        switchMap((mobiWebToken: string | null) => this.validateToken(mobiWebToken)),
        switchMap(validationStatus => this.verifyAuth(validationStatus)),
        tap(validationResult => this.handleValidationResult(validationResult, showToast)),
        map(({ valid }) => valid)
    );
  }

  private validateToken(mobiWebToken: string | null): Observable<{tokenExists: boolean; isExpired: boolean}> {
    // Check if the token exists and whether it is expired
    if (!mobiWebToken) {
        return of({ tokenExists: false, isExpired: false });
    }
    const tokenPayload = this.decodeToken(mobiWebToken);
    const isExpired = tokenPayload && tokenPayload.exp && (Date.now() >= tokenPayload.exp * 1000);
    return of({ tokenExists: true, isExpired });
  }

  private verifyAuth(validationStatus: {tokenExists: boolean; isExpired: boolean}): Observable<{valid: boolean, tokenExists: boolean, isExpired: boolean}>{
    // If the token exists and is not expired, check the session
    const tokenExists = validationStatus.tokenExists;
    const isExpired = validationStatus.isExpired;
    if (!validationStatus.tokenExists || validationStatus.isExpired) {
      return of({ 
          valid: false, 
          tokenExists,
          isExpired
      });
    }
    return this.isAuthenticated().pipe(
        map((authenticated: boolean) => ({
            valid: !!authenticated,
            tokenExists,
            isExpired
        })),
        catchError(() => of({ 
            valid: false, 
            tokenExists,
            isExpired
        }))
    );
  }

  private handleValidationResult(validationResults: {valid: boolean, tokenExists: boolean, isExpired: boolean}, showToast: boolean): void {
    if (!validationResults.valid) {
      if (showToast) {
        if (!validationResults.tokenExists) {
          this.toast.createErrorToast(this.NO_TOKEN_MESSAGE);
        } else if (validationResults.isExpired) {
            this.toast.createErrorToast(this.TOKEN_EXPIRED_MESSAGE);
        } else {
            this.toast.createErrorToast(this.SESSION_INVALID_MESSAGE);
        }
      }
      this.clearServiceStates();
      this.dialog.closeAll();
      this.router.navigate(['/login']);
    }
  }
  /**
   * Decodes a JWT token and returns its payload.
   * 
   * This method extracts the payload (the middle part of the JWT) by splitting the token,
   * decodes the Base64Url-encoded string, and parses it into a JSON object.
   * 
   * @param {string} token - The JWT token to decode.
   * @returns {any} - The decoded payload as a JSON object, or null if decoding fails.
   * 
   * @throws Will log an error to the console if the token is invalid or cannot be decoded.
   */
  decodeToken(token: string): any {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
  }

  /**
   * Retrieves the value of a specified cookie by name.
   * 
   * This method searches the `document.cookie` string for a cookie with the given name,
   * and if found, returns its value. The value is decoded from URL encoding.
   * If the cookie is not found, the method returns `null`.
   * 
   * @param {string} name - The name of the cookie to retrieve.
   * @returns {string|null} - The value of the cookie if found, otherwise `null`.
   */
  getCookie(name: string): string | null {
      const matches = document.cookie.match(new RegExp(
          '(?:^|; )' + name.replace(/([\.$?*|{}()[]\/+^])/g, '\\$1') + '=([^;]*)'
      ));
      return matches ? decodeURIComponent(matches[1]) : null;
  }

  /**
   * Helper function to delete a cookie by name
   * @param name name of cookie
   */
  deleteCookie(name: string): void {
      document.cookie = `${name}=; Max-Age=-99999999; path=/;`;
  }
}
