/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

    angular
        /**
         * @ngdoc overview
         * @name activityTitle
         *
         * @description
         * The `activityTitle` module only provides the `activityTitle` directive which creates the title of
         * an `Activity`.
         */
        .module('activityTitle', [])
        /**
         * @ngdoc directive
         * @name activityTitle.directive:activityTitle
         * @scope
         * @restrict E
         * @requires provManager.service:provManagerService
         * @requires util.service:utilService
         * @requires userManager.service:userManagerService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `activityTitle` is a directive which creates a `div` containing a title for the provided `Activity` using
         * the username of the associated user, the word associated with the type of Activity, and the titles of the
         * main associated `Entities`. The word and the predicate to retrieve `Entities` with are collected from the
         * {@link provManager.service:provManagerService provManagerService}. The directive is replaced by the
         * contents of its template.
         *
         * @param {Object} activity A JSON-LD object of an `Activity`
         * @param {Object[]} entities An array of JSON-LD objects of `Entities`
         */
        .directive('activityTitle', activityTitle);

    activityTitle.$inject = ['provManagerService', 'utilService', 'userManagerService', 'prefixes'];

    function activityTitle(provManagerService, utilService, userManagerService, prefixes) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {
                activity: '<',
                entities: '<'
            },
            controller: ['$scope', function($scope) {
                var dvm = this;
                var um = userManagerService;
                var util = utilService;
                var pm = provManagerService;
                dvm.username = '(None)';
                dvm.word = 'affected';
                dvm.entities = '(None)';

                setUsername(util.getPropertyId($scope.activity, prefixes.prov + 'wasAssociatedWith'));
                setWord($scope.activity);
                setEntities($scope.activity);

                $scope.$watch('activity', newValue => {
                    setUsername(util.getPropertyId(newValue, prefixes.prov + 'wasAssociatedWith'));
                    setWord(newValue);
                    setEntities(newValue);
                });

                function setEntities(activity) {
                    var types = _.get(activity, '@type', []);
                    var pred = '';
                    _.forEach(pm.activityTypes, obj => {
                        if (_.includes(types, obj.type)) {
                            pred = obj.pred;
                            return false;
                        }
                    });
                    var entityTitles = _.map(_.get(activity, "['" + pred + "']", []), idObj => {
                        var entity = _.find($scope.entities, {'@id': idObj['@id']});
                        return util.getDctermsValue(entity, 'title');
                    });
                    dvm.entities = _.join(entityTitles, ', ').replace(/,(?!.*,)/gmi, ' and') || '(None)';
                }
                function setUsername(iri) {
                    if (iri) {
                        dvm.username = _.get(_.find(um.users, {iri}), 'username', '(None)');
                    } else {
                        dvm.username = '(None)';
                    }
                }
                function setWord(activity) {
                    var types = _.get(activity, '@type', []);
                    _.forEach(pm.activityTypes, obj => {
                        if (_.includes(types, obj.type)) {
                            dvm.word = obj.word;
                            return false;
                        }
                    });
                }
            }],
            templateUrl: 'modules/activityLog/directives/activityTitle/activityTitle.html'
        };
    }
})();
