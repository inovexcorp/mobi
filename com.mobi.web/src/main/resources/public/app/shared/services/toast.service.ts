/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

/**
 * @class shared.ToastService
 *
 * `ToastService` is a service that provides utility methods for creating Toasts across Mobi.
 */
@Injectable()
export class ToastService {
    constructor(private toastr: ToastrService) {}

    /**
     * Creates an error toast with the passed error text that will disappear after 3 seconds
     *
     * @param {string} text The text for the body of the error toast
     */
    createErrorToast(text: string, config = {timeOut: 3000}): void {
        this.toastr.error(text, 'Error', config);
    }
    /**
     * Creates a success toast with the passed success text that will disappear after 3 seconds
     *
     * @param {string} text The text for the body of the success toast
     */
    createSuccessToast(text: string, config = {timeOut: 3000}): void {
        this.toastr.success(text, 'Success', config);
    }
    /**
     * Creates a warning toast with the passed success text that will disappear after 3 seconds
     *
     * @param {string} text The text for the body of the warning toast
     * @param {Object} config The configuration for the toast. Defaults to a timeout of 3 seconds
     */
    createWarningToast(text: string, config = {timeOut: 3000}): void {
        this.toastr.warning(text, 'Warning', config);
    }
    /**
     * Close open toastr
     */
    clearToast(): void {
        this.toastr.clear();
    }
}
