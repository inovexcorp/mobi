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
import { UntypedFormControl } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Injectable } from '@angular/core';

/**
 * Custom Angular Material ErrorStateMatcher to remove requirement on the submitted nature of form.
 * Copied from Angular Material code v5.2.5 
 */
@Injectable()
export class MobiErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(control: UntypedFormControl | null): boolean {
        return !!(control && control.invalid && control.touched);
    }
}
