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