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
         * @name replyComment
         *
         * @description
         * The `replyComment` module only provides the `replyComment` directive
         * which creates a {@link materialTabset.directive:materialTabset} with tabs related to the discussion and
         * difference of a Merge Request.
         */
        .module('replyComment', [])
        /**
         * @ngdoc directive
         * @name replyComment.directive:replyComment
         * @scope
         * @restrict E
         *
         * @description
         * `replyComment` is a directive which creates a div containing 
         * The directive is replaced by the contents of its template.
         *
         * @param {Object} request An object representing a Merge Request
         */
        .directive('replyComment', replyComment);

    replyComment.$inject = ['$q', 'mergeRequestManagerService', 'utilService'];

    function replyComment($q, mergeRequestManagerService, utilService) {
        return {
            restrict: 'E',
            templateUrl: 'modules/merge-requests/directives/replyComment/replyComment.html',
            replace: true,
            scope: {},
            bindToController: {
                request: '<',
                parentId: '<',
            },
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;
                var mm = mergeRequestManagerService;
                var util = utilService;
                dvm.edit = false;
                dvm.replyComment = '';

                dvm.reply = function() {
                    console.log('Making reply comment to ' + dvm.parentId + ' with ' + dvm.newComment);
                    mm.createComment(dvm.request.jsonld['@id'], dvm.replyComment, dvm.parentId)
                        .then(() => {
                            console.log('Comment made');
                            dvm.replyComment = '';
                            dvm.edit = false;
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