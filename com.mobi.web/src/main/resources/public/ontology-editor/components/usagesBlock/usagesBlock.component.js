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
     * @name ontology-editor.component:usagesBlock
     * @requires shared.service:ontologyStateService
     * @requires shared.service:ontologyManagerService
     * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
     *
     * @description
     * `usagesBlock` is a component that creates a section that displays the provided usages of the
     * {@link shared.service:ontologyStateService selected entity} using
     * {@link ontology-editor.component:propertyValues}. The usages are only shown 100 at a time to save rendering
     * time with a link at the bottom to load more.
     * 
     * @param {Object[]} usages An array of usage results for the selected entity
     */
    const usagesBlockComponent = {
        templateUrl: 'ontology-editor/components/usagesBlock/usagesBlock.component.html',
        bindings: {
            usages: '<'
        },
        controllerAs: 'dvm',
        controller: usagesBlockComponentCtrl
    };

    usagesBlockComponentCtrl.$inject = ['ontologyStateService', 'ontologyUtilsManagerService'];

    function usagesBlockComponentCtrl(ontologyStateService, ontologyUtilsManagerService) {
        var dvm = this;
        dvm.size = 100;
        dvm.index = 0;
        dvm.os = ontologyStateService;
        dvm.ontoUtils = ontologyUtilsManagerService;
        dvm.id = '';
        dvm.results = {};
        dvm.total = 0;
        dvm.shown = 0;

        dvm.$onInit = function() {
            dvm.id = 'usages-' + dvm.os.getActiveKey() + '-' + dvm.os.listItem.ontologyRecord.recordId;
        }
        dvm.$onChanges = function() {
            dvm.size = 100;
            dvm.index = 0;
            dvm.shown = 0;
            dvm.results = getResults();
        }
        dvm.getMoreResults = function() {
            dvm.index++;
            _.forEach(_.get(_.chunk(dvm.usages, dvm.size), dvm.index, []), binding => addToResults(dvm.results, binding));
        }

        function getResults() {
            var results = {};
            dvm.total = _.get(dvm.usages, 'length');
            var chunks = _.chunk(dvm.usages, dvm.size);
            dvm.chunks = chunks.length === 0 ? 0 : chunks.length - 1;
            _.forEach(_.get(chunks, dvm.index, []), binding => addToResults(results, binding));
            return results;
        }

        function addToResults(results, binding) {
            results[binding.p.value] = _.union(_.get(results, binding.p.value, []), [{subject: binding.s.value, predicate: binding.p.value, object: binding.o.value}]);
            dvm.shown++;
        }
    }

    angular.module('ontology-editor')
        .component('usagesBlock', usagesBlockComponent);
})();
