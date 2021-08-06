import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { includes } from "lodash";
import { Observable } from "rxjs";
import { SpinnerService } from "./spinner.service";

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
        return next.handle(req).do((event: HttpEvent<any>) => {
            if (event instanceof HttpResponse && this._shouldTrack(req)) {
                this.service.removeRequest();
            }
        }, (err: any) => {
            if (err instanceof HttpErrorResponse && this._shouldTrack(req)) {
                this.service.removeRequest();
            }
        });
    }

    private _shouldTrack(req: HttpRequest<any>) {
        return !includes(req.url, '.html');
    }
}