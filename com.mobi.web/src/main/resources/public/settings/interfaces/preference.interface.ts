import { FormGroup } from "@angular/forms";

/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
export interface Preference {
    json: any;
    formFields: any;
    formFieldStrings: Array<string>;
    mainPropertyShapeId: string;
    values: Array<any>;
    requiredPropertyShape: any;
    topLevelPreferenceNodeshapeInstanceId: string;
    topLevelPreferenceNodeshapeInstance: any;
    type: string;
    addValue(value): void;
    addBlankForm(): void;
    buildForm(): FormGroup;
    updateWithFormValues(form: FormGroup): void;
    stripBlankValues(): void;
    exists(): boolean;
    asJsonLD(): Array<any>;
}
