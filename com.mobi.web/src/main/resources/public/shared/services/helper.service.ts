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