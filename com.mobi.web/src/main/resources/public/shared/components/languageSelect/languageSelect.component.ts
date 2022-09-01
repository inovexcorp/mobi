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

import { Component, Inject, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import './languageSelect.component.scss';

/**
 * @class shared.LanguageSelect
 *
 * A component which provides options for a formatted ui-select for picking language tags. The
 * select is bound to `bindModel`, but only one way. The provided `changeEvent` function is expected to update the
 * value of `bindModel`. The component provides an option to have a clear selection button. If the button is not
 * enabled, the choice defaults to English.
 *
 * @param {FormGroup} parentForm The parent FormGroup to attached the language select to
 * @param {boolean} disableClear A boolean that indicates if the clear button should be disabled
 */
@Component({
    selector: 'language-select',
    templateUrl: './languageSelect.component.html'
})
export class LanguageSelectComponent implements OnInit {
    @Input() parentForm: FormGroup;
    @Input() disableClear: boolean;
    
    languages: {label: string, value: string}[] = [];

    constructor(@Inject('propertyManagerService') private pm) {}

    ngOnInit(): void {
        this.languages = this.pm.languageList;

        if (this.disableClear && !this.parentForm.controls.language.value) {
            this.parentForm.controls.language.setValue('en');
        }
    }
    clear(): void {
        this.parentForm.controls.language.setValue('');
    }
}