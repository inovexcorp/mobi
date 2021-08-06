/**
 * @class SpinnerService
 * 
 * A service meant for tracking requests in order to display a fill screen spinner.
 */
export class SpinnerService {
    public pendingRequests = 0;

    constructor() {}

    addRequest(): void {
        this.pendingRequests++;
    }

    removeRequest(): void {
        this.pendingRequests--;
    }
}