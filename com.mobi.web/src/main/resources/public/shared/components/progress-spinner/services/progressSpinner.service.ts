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

import { ElementRef, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {  finalize } from 'rxjs/operators';

/**
 * @class ProgressSpinnerService
 * 
 * A service meant for tracking requests in order to display a full screen spinner.
 */
@Injectable()
export class ProgressSpinnerService {
   // Observable string source
    // Only the service has access to the subject
    private pendingRequests = 0;
    private renderer: Renderer2;
    private templateRef: ElementRef;
    private _loadingSubject = new Subject<boolean>();
    private _diameterSubject = new Subject<number>();
    // Observable Streams
    public isLoading$ = this._loadingSubject.asObservable();
    public diameterOb$ = this._diameterSubject.asObservable();
    
    constructor(rendererFactory: RendererFactory2 ){
        this.renderer = rendererFactory.createRenderer(null, null);
    }

    public track<T>(observable: Observable<T>) : Observable<T> {
        this.startSpinner();
        this.pendingRequests++;
        return observable.pipe(
            finalize(
                () => {
                    this.removePendingRequest();
                }
            )
        );
    }

    public startSpinner(): void {
        this._loadingSubject.next(true);
    }

    public removePendingRequest(): void {
        //prevent negative numbers
        if (this.pendingRequests !== 0) {
            this.pendingRequests--;
        }
        if (this.pendingRequests === 0) {
            this.stopSpinner();
        }
    }

    public stopSpinner(): void {
        this._loadingSubject.next(false);
    }

    public setSpinnerTemplate(tmpl: ElementRef): void {
        this.templateRef = tmpl;
    }

    public startLoadingForComponent(component: any, diameter = 50 ): void {
        const self = this;
        this._diameterSubject.next(diameter);
        const element: HTMLElement = this._getNativeElement(component);
        if (element) {
            element.setAttribute('style', 'position: relative');
            element.insertAdjacentHTML(
              'beforeend',
              self.templateRef.nativeElement.innerHTML
            );
        }
      }
    
      public finishLoadingForComponent(component: any): void {
        const element: HTMLElement = this._getNativeElement(component);
        const loadingCompTemplate = element.querySelector('#spinner-local');
        if (element && loadingCompTemplate) {
            this.renderer.removeChild(element, loadingCompTemplate);
        }
      }

      /**
       * Checks for Angular Material underlineRef
       * returns the nativeElement Object.
       * @param component element reference
       * @returns HTMLElement 
       */
      _getNativeElement(component: any) : HTMLElement {
          // check if 
          if (Object.prototype.hasOwnProperty.call(component, '_elementRef')) {
              return component._elementRef.nativeElement;
          } else {
              return component.nativeElement;
          }
      }
}
