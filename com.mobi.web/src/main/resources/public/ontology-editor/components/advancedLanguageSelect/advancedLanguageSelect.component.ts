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
import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

/**
 * @class ontology-editor.AdvancedLanguageSelectComponent
 *
 * A component that creates a collapsible {@link shared.LanguageSelectComponent} bound to the `language` control of the
 * provided parent `FormGroup`. When collapsed, sets the `language` value to empty string, when opened, defaults to 'en'.
 * 
 * @param {FormGroup} parentForm The parent FormGroup to attached the language select to
 */
@Component({
    selector: 'advanced-language-select',
    templateUrl: './advancedLanguageSelect.component.html'
})
export class AdvancedLanguageSelectComponent {
    @Input() parentForm: FormGroup;

    isShown = false;

    constructor() {}

    show(): void {
        this.isShown = true;
        this.parentForm.controls.language.setValue('en');
    }
    hide(): void {
        this.isShown = false;
        this.parentForm.controls.language.setValue('');
    }
}