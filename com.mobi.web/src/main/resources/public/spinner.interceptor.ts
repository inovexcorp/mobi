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
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { includes } from "lodash";
import { Observable } from "rxjs";
import { SpinnerService } from "./spinner.service";
import {tap} from "rxjs/operators";

/**
 * @class SpinnerInterceptor
 * 
 * An implementation of {@link HttpInterceptor} that tracks incoming requests in the {@link SpinnerService} if they are
 * not requests for HTML documents.
 */
@Injectable()
export class SpinnerInterceptor implements HttpInterceptor {
    constructor(private service: SpinnerService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (this._shouldTrack(req)) {
            this.service.addRequest();
        }
        return next.handle(req).pipe(tap((event: HttpEvent<any>) => {
            if (event instanceof HttpResponse && this._shouldTrack(req)) {
                this.service.removeRequest();
            }
        }, (err: any) => {
            if (err instanceof HttpErrorResponse && this._shouldTrack(req)) {
                this.service.removeRequest();
            }
        }));
    }

    private _shouldTrack(req: HttpRequest<any>) {
        return !includes(req.url, '.html');
    }
}
