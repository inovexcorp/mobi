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
         * @name mergeRequestDiscussion
         *
         * @description
         * The `mergeRequestDiscussion` module only provides the `mergeRequestDiscussion` directive
         * which creates a {@link materialTabset.directive:materialTabset} with tabs related to the discussion and
         * difference of a Merge Request.
         */
        .module('mergeRequestDiscussion', [])
        /**
         * @ngdoc directive
         * @name mergeRequestDiscussion.directive:mergeRequestDiscussion
         * @scope
         * @restrict E
         *
         * @description
         * `mergeRequestDiscussion` is a directive which creates a div containing 
         * The directive is replaced by the contents of its template.
         *
         * @param {Object} request An object representing a Merge Request
         */
        .directive('mergeRequestDiscussion', mergeRequestDiscussion);

    mergeRequestDiscussion.$inject = ['$q', 'mergeRequestManagerService', 'utilService'];

    function mergeRequestDiscussion($q, mergeRequestManagerService, utilService) {
        return {
            restrict: 'E',
            templateUrl: 'modules/merge-requests/directives/mergeRequestDiscussion/mergeRequestDiscussion.html',
            replace: true,
            scope: {},
            bindToController: {
                request: '=',
            },
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;
                var mm = mergeRequestManagerService;
                var util = utilService;

                dvm.newComment = '';

                dvm.comment = function() {
                    console.log('Making comment with ' + dvm.newComment);
                    mm.createComment(dvm.request.jsonld['@id'], dvm.newComment)
                        .then(() => {
                            console.log('Comment made');
                            dvm.newComment = '';
                            return mm.getComments(dvm.request.jsonld['@id']);
                        }, $q.reject)
                        .then(comments => {
                            dvm.request.comments = comments;
                        }, util.createErrorToast);
                }
            }
        }
    }
})();