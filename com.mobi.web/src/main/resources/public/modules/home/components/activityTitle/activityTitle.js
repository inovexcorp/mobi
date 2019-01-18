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

/**
 * @ngdoc component
 * @name activityTitle.component:activityTitle
 * @requires provManager.service:provManagerService
 * @requires util.service:utilService
 * @requires userManager.service:userManagerService
 * @requires prefixes.service:prefixes
 *
 * @description
 * `activityTitle` is a component which creates a `div` containing a title for the provided `Activity` using
 * the username of the associated user, the word associated with the type of Activity, and the titles of the
 * main associated `Entities`. The word and the predicate to retrieve `Entities` with are collected from the
 * {@link provManager.service:provManagerService provManagerService}.
 *
 * @param {Object} activity A JSON-LD object of an `Activity`
 * @param {Object[]} entities An array of JSON-LD objects of `Entities`
 */
const activityTitleComponent = {
    templateUrl: 'modules/home/components/activityTitle/activityTitle.html',
    bindings: {
        activity: '<',
        entities: '<'
    },
    controllerAs: 'dvm',
    controller: activityTitleComponentCtrl
};

activityTitleComponentCtrl.$inject = ['provManagerService', 'utilService', 'userManagerService', 'prefixes'];

function activityTitleComponentCtrl(provManagerService, utilService, userManagerService, prefixes) {
    var dvm = this;
    var um = userManagerService;
    var util = utilService;
    var pm = provManagerService;
    dvm.username = '(None)';
    dvm.word = 'affected';
    dvm.entitiesStr = '(None)';

    dvm.$onInit = function() {
        setUsername(util.getPropertyId(dvm.activity, prefixes.prov + 'wasAssociatedWith'));
        setWord(dvm.activity);
        setEntities(dvm.activity);
    }

    dvm.$onChanges = function(changesObj) {
        if (changesObj.activity) {
            setUsername(util.getPropertyId(changesObj.activity.newValue, prefixes.prov + 'wasAssociatedWith'));
            setWord(changesObj.activity.newValue);
            setEntities(changesObj.activity.newValue);
        }
    }

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
            var entity = _.find(dvm.entities, {'@id': idObj['@id']});
            return util.getDctermsValue(entity, 'title');
        });
        dvm.entitiesStr = _.join(entityTitles, ', ').replace(/,(?!.*,)/gmi, ' and') || '(None)';
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
}

angular.module('catalog')
    .component('activityTitle', activityTitleComponent);