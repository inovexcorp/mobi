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
export class YasguiQuery {
    private _recordId: string;
    private _commitId: string;
    private _recordTitle: string;
    private _submitDisabled: boolean;
    private _queryString: string;
    private _response: any;
    private _isImportedOntologyIncluded: boolean;
    get recordId(): string {
        return this._recordId;
    }

    set recordId(value: string) {
        this._recordId = value;
    }

    get commitId(): string {
        return this._commitId;
    }

    set commitId(value: string) {
        this._commitId = value;
    }

    get recordTitle(): string {
        return this._recordTitle;
    }

    set recordTitle(value: string) {
        this._recordTitle = value;
    }

    get submitDisabled(): boolean {
        return this._submitDisabled;
    }

    set submitDisabled(value: boolean) {
        this._submitDisabled = value;
    }

    get queryString(): string {
        return this._queryString;
    }

    set queryString(value: string) {
        this._queryString = value;
    }

    get response(): any {
        return this._response;
    }

    set response(value: any) {
        this._response = value;
    }

    get executionTime(): number {
        return this._executionTime;
    }

    set executionTime(value: number) {
        this._executionTime = value;
    }

    set isImportedOntologyIncluded(value: boolean) {
        this._isImportedOntologyIncluded = value;
    }

    get isImportedOntologyIncluded(): boolean {
       return this._isImportedOntologyIncluded;
    }
    private _executionTime: number;

    constructor(recordId = '', commitId = '') {
        this._recordId = recordId;
        this._commitId = commitId;
        this._recordTitle = '';
        this._submitDisabled = false;
        this._queryString = '';
        this._response = {};
        this._executionTime = 0;
        this._isImportedOntologyIncluded = false;
    }
}
