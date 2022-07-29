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
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { Subscription } from 'rxjs';

import { ProgressSpinnerService } from '../../services/progressSpinner.service';

import './spinner.component.scss';
/**  
 * @class shared.ProgressSpinnerComponent
 *
 * A component that creates a spinning icon with a transparent background
*/
@Component({
    selector: 'progress-spinner',
    templateUrl: 'spinner.component.html',
    changeDetection: ChangeDetectionStrategy.Default
})
export class SpinnerComponent implements OnInit, OnDestroy, AfterViewInit {
    @Input() diameter: number;
    @Input() isLoading: boolean;
    private loadingSub = new Subscription();
    private diameterSub = new Subscription();
    localDiameter : number;

    @ViewChild('spinnerComponentLocal') spinnerComponent: ElementRef<HTMLElement>;
    
    constructor( private readonly spinnerSrv: ProgressSpinnerService) {
        this.loadingSub = this.spinnerSrv.isLoading$.subscribe(
            state => {
                this.isLoading = state;
            }
        );
        this.diameterSub = this.spinnerSrv.diameterOb$.subscribe( val => { 
            this.localDiameter = val;
        });
    }
    ngAfterViewInit(): void {
        this.spinnerSrv.setSpinnerTemplate(this.spinnerComponent);
    }
    ngOnInit(): void {
        this.localDiameter = 50;
        this.diameter =  this.diameter || 50;
        this.isLoading =  this.isLoading || false;
    }
    ngOnDestroy(): void {
        this.loadingSub.unsubscribe();
        this.diameterSub.unsubscribe();
    }
}
