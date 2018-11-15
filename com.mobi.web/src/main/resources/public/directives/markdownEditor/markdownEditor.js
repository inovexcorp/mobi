/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

    angular
        /**
         * @ngdoc overview
         * @name markdownEditor
         *
         * @description
         * The `markdownEditor` module only provides the `markdownEditor` directive which creates a
         */
        .module('markdownEditor', [])
        /**
         * @ngdoc directive
         * @name markdownEditor.directive:markdownEditor
         * @scope
         * @restrict E
         *
         * @description
         * `markdownEditor` is a directive which creates a 
         *
         * @param {*} bindModel The variable to bind the value of the markdownEditor to
         */
        .directive('markdownEditor', markdownEditor);

        markdownEditor.$inject = ['$sce', 'showdown'];

        function markdownEditor($sce, showdown) {
            return {
                restrict: 'E',
                replace: true,
                scope: {},
                bindToController: {
                    bindModel: '=ngModel',
                    placeHolder: '<'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var converter = new showdown.Converter();
                    converter.setFlavor('github');

                    dvm.showPreview = false;
                    dvm.preview = '';
                    dvm.markdownTooltip = $sce.trustAsHtml('For information about markdown syntax, see <a href="https://guides.github.com/features/mastering-markdown/" target="_blank">here</a>');

                    dvm.togglePreview = function() {
                        if (dvm.showPreview) {
                            dvm.preview = '';
                            dvm.showPreview = false;
                        } else {
                            dvm.preview = converter.makeHtml(dvm.bindModel);
                            dvm.showPreview = true;
                        }
                    }
                },
                templateUrl: 'directives/markdownEditor/markdownEditor.html'
            }
        }
})();
