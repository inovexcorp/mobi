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
import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

/**
 * @class shared.HelperService
 * 
 * A service that provides helper functions to be used throughout the application. Will be combined with the
 * `utilService` once it has been upgraded.
 */
@Injectable()
export class HelperService {
    constructor() {}

    /**
     * Creates an instance of {@link HttpParams} based on the provided object. Each key will become a query param and
     * the values will be converted to compatible strings. If the value is an array, individual elements will be added
     * as separate param values.
     * 
     * @param params An object to convert to an instance of HttpParams
     * @returns An HttpParams instance with params for each key
     */
    createHttpParams(params: any): HttpParams {
        let httpParams: HttpParams = new HttpParams();
        Object.keys(params).forEach(param => {
            if (params[param] !== undefined && params[param] !== null && params[param] !== '') {
                if (Array.isArray(params[param])) {
                    params[param].forEach(el => {
                        httpParams = httpParams.append(param, this.convertToString(el));
                    });
                } else {
                    httpParams = httpParams.append(param, this.convertToString(params[param]));
                }
            }
        });
    
        return httpParams;
    }

    private convertToString(param: any): string {
        return typeof param === 'string' ? param : '' + param;
    }
}
