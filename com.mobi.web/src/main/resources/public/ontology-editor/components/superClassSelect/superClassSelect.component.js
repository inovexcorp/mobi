/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
(function() {
    'use strict';

    /**
     * @ngdoc component
     * @name ontology-editor.component:superClassSelect
     *
     * @description
     * `classSelect` is a component that creates a collapsible {@link ontology-editor.component:ontologyClassSelect} for
     * selecting the super classes of a class. When collapsed and then reopened, all previous values are cleared. The
     * value of the `ontologyClassSelect` is bound to `bindModel`, but only one way. The provided `changeEvent`
     * function is expected to update the value of `bindModel`.
     *
     * @param {Object[]} bindModel The variable to bind the selected classes to in the form of `{'@id': propIRI}`
     * @param {Function} changeEvent A function that will be called when the value of the `ontologyClassSelect` changes.
     * Should update the value of `bindModel`. Expects an argument called `values`.
     */
    const superClassSelectComponent = {
        templateUrl: 'ontology-editor/components/superClassSelect/superClassSelect.component.html',
        bindings: {
            bindModel: '<',
            changeEvent: '&'
        },
        controllerAs: 'dvm',
        controller: superClassSelectComponentCtrl
    };

    function superClassSelectComponentCtrl() {
        var dvm = this;
        dvm.isShown = false;

        dvm.$onChanges = function() {
            dvm.iris = _.map(dvm.bindModel, '@id');
        }
        dvm.show = function() {
            dvm.isShown = true;
        }
        dvm.hide = function() {
            dvm.isShown = false;
            dvm.changeEvent({values: []});
        }
        dvm.onChange = function(values) {
            dvm.changeEvent({values: _.map(values, iri => ({'@id': iri}))});
        }
    }

    angular.module('ontology-editor')
        .component('superClassSelect', superClassSelectComponent);
})();