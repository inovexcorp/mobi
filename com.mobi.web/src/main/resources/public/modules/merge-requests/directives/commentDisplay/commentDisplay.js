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
         * @name commentDisplay
         *
         * @description
         * The `commentDisplay` module only provides the `commentDisplay` directive
         * which creates a {@link materialTabset.directive:materialTabset} with tabs related to the discussion and
         * difference of a Merge Request.
         */
        .module('commentDisplay', [])
        /**
         * @ngdoc directive
         * @name commentDisplay.directive:commentDisplay
         * @scope
         * @restrict E
         *
         * @description
         * `commentDisplay` is a directive which creates a div containing 
         * The directive is replaced by the contents of its template.
         *
         * @param {Object} request An object representing a Merge Request
         */
        .directive('commentDisplay', commentDisplay);

    commentDisplay.$inject = ['$q', 'mergeRequestManagerService', 'userManagerService', 'loginManagerService', 'utilService', 'prefixes', 'modalService', 'showdown'];

    function commentDisplay($q, mergeRequestManagerService, userManagerService, loginManagerService, utilService, prefixes, modalService, showdown) {
        return {
            restrict: 'E',
            templateUrl: 'modules/merge-requests/directives/commentDisplay/commentDisplay.html',
            replace: true,
            scope: {},
            bindToController: {
                request: '<',
                comment: '<',
                isReply: '<'
            },
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;
                var mm = mergeRequestManagerService;
                var um = userManagerService;
                var lm = loginManagerService;
                var util = utilService;
                var converter = new showdown.Converter();
                converter.setFlavor('github');

                dvm.getCreator = function() {
                    var iri = getCreatorIRI();
                    return _.get(_.find(um.users, {iri}), 'username');
                }
                dvm.getComment = function() {
                    return converter.makeHtml(util.getDctermsValue(dvm.comment, 'description'));
                }
                dvm.getIssued = function() {
                    return util.getDctermsValue(dvm.comment, 'issued');
                }
                dvm.isCreator = function() {
                    return lm.currentUserIRI === getCreatorIRI();
                }
                dvm.confirmDelete = function() {
                    modalService.openConfirmModal('<p>Are you sure you want to delete this comment?</p>', dvm.deleteComment);
                }
                dvm.deleteComment = function() {
                    console.log('Deleting ' + dvm.comment['@id']);
                    mm.deleteComment(dvm.request.jsonld['@id'], dvm.comment['@id'])
                        .then(() => {
                            console.log('Deleted Comment');
                            return mm.getComments(dvm.request.jsonld['@id']);
                        }, $q)
                        .then(comments => {
                            dvm.request.comments = comments;
                        }, util.createErrorToast);
                }

                function getCreatorIRI() {
                    return util.getDctermsId(dvm.comment, 'creator');
                }
            }
        }
    }
})();