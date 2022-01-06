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
import './advancedLanguageSelect.component.scss';

const template = require('./advancedLanguageSelect.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:advancedLanguageSelect
 *
 * @description
 * `advancedLanguageSelect` is a component that creates a collapsible {@link shared.component:languageSelect}. The
 * `languageSelect` is bound to `bindModel`, but only one way. The provided `changeEvent` function is expected to
 * update the value of `bindModel`.
 * 
 * @param {string} bindModel The variable to bind the value of the `languageSelect` to
 * @param {Function} changeEvent A function that is called when the value of the `languageSelect` changes. Should
 * update the value of `bindModel`. Expects an argument called `value`
 */
const advancedLanguageSelectComponent = {
    template,
    bindings: {
        bindModel: '<',
        changeEvent: '&'
    },
    controllerAs: 'dvm',
    controller: advancedLanguageSelectComponentCtrl
};

function advancedLanguageSelectComponentCtrl() {
    var dvm = this;
    dvm.isShown = false;

    dvm.onChange = function(value) {
        dvm.changeEvent({value});
    }
    dvm.show = function() {
        dvm.isShown = true;
        dvm.changeEvent({value: 'en'});
    }
    dvm.hide = function() {
        dvm.isShown = false;
        dvm.changeEvent({value: undefined});
    }
}

export default advancedLanguageSelectComponent;
