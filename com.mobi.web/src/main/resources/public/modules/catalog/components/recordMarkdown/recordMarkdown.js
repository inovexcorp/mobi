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
(function () {
    'use strict';

    /**
     * @ngdoc component
     * @name catalog.component:recordMarkdown
     * @requires utilService.service:utilService
     *
     * @description
     * `recordMarkdown` is a component which creates a display for the `dcterms:abstract` of the provided catalog Record
     * as markdown HTML. If the user can edit the record, as determined by the provided `canEdit` boolean, the display
     * will turn into an editor for the markdown when clicked. The markdown editor contains a button with information
     * about the markdown syntax, a button to preview the markdown, a button to cancel the edit, and a button to save
     * the edited markdown which will call the provided `updateRecord` method passing the edited Record JSON-LD.
     * 
     * @param {Object} record A JSON-LD object for a catalog Record
     * @param {boolean} canEdit Whether the Record can be edited by the current user
     * @param {Function} updateRecord A method to update the Record. Expects a parameter called `record` and that the
     * method will return a Promise.
     */
    const recordMarkdownComponent = {
        templateUrl: 'modules/catalog/components/recordMarkdown/recordMarkdown.html',
        bindings: {
            record: '<',
            canEdit: '<',
            updateRecord: '&'
        },
        controllerAs: 'dvm',
        controller: recordMarkdownComponentCtrl
    };

    recordMarkdownComponentCtrl.$inject = ['$sce', '$q', 'utilService', 'showdown'];

    function recordMarkdownComponentCtrl($sce, $q, utilService, showdown) {
        var dvm = this;
        var util = utilService;
        dvm.converter = new showdown.Converter();
        dvm.converter.setFlavor('github');
        dvm.markdownHTML = '';
        dvm.edit = false;
        dvm.showPreview = false;
        dvm.editMarkdown = ''
        dvm.preview = '';
        dvm.markdownTooltip = $sce.trustAsHtml('For information about markdown syntax, see <a href="https://guides.github.com/features/mastering-markdown/" target="_blank">here</a>');

        dvm.$onInit = function() {
            if (dvm.record && !_.isEmpty(dvm.record)) {
                dvm.markdownHTML = dvm.converter.makeHtml(util.getDctermsValue(dvm.record, 'abstract'));
            }
        }
        dvm.$onChanges = function() {
            if (dvm.record && !_.isEmpty(dvm.record)) {
                dvm.markdownHTML = dvm.converter.makeHtml(util.getDctermsValue(dvm.record, 'abstract'));                
            }
        }
        dvm.togglePreview = function() {
            if (dvm.showPreview) {
                dvm.preview = '';
                dvm.showPreview = false;
            } else {
                dvm.preview = dvm.converter.makeHtml(dvm.editMarkdown);
                dvm.showPreview = true;
            }
        }
        dvm.showEdit = function() {
            if (dvm.canEdit) {
                dvm.edit = true;
                dvm.editMarkdown = util.getDctermsValue(dvm.record, 'abstract');
            }
        }
        dvm.saveEdit = function() {
            this.originalValue = util.getDctermsValue(dvm.record, 'abstract');
            if (this.originalValue === this.editMarkdown) {
                dvm.edit = false;
                dvm.showPreview = false;
                dvm.preview = '';
                dvm.editMarkdown = '';
            } else {
                util.updateDctermsValue(dvm.record, 'abstract', this.editMarkdown);
                $q.when()
                    .then(() => {
                        return dvm.updateRecord({record: dvm.record});
                    })
                    .then(() => {
                        dvm.edit = false;
                        dvm.showPreview = false;
                        dvm.preview = '';
                        dvm.editMarkdown = '';
                    }, () => {
                        util.updateDctermsValue(dvm.record, 'abstract', this.originalValue);
                    });
            }
        }
        dvm.cancelEdit = function() {
            dvm.edit = false;
            dvm.showPreview = false;
            dvm.preview = '';
            dvm.editMarkdown = '';
        }
    }

    angular.module('catalog')
        .component('recordMarkdown', recordMarkdownComponent);
})();