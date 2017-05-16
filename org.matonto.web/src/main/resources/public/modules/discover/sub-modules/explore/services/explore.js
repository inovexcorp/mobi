/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
         * @name explore
         *
         * @description
         * The `explore` module only provides the `exploreService` service which provides access
         * to the MatOnto explorable-datasets REST endpoints.
         */
        .module('explore', [])
        /**
         * @ngdoc service
         * @name explore.service:exploreService
         * @requires $q
         *
         * @description
         * `exploreService` is a service that provides access to the MatOnto explorable-datasets REST
         * endpoints.
         */
        .service('exploreService', exploreService);
    
    exploreService.$inject = ['$http', '$q', '$httpParamSerializer', 'utilService'];
    
    function exploreService($http, $q, $httpParamSerializer, utilService) {
        var self = this;
        var prefix = 'explorable-datasets/';
        var util = utilService;
        
        /**
         * @ngdoc method
         * @name getClassDetails
         * @methodOf explore.service:exploreService
         *
         * @description
         * Calls the GET /matontorest/explorable-datasets/{recordId}/class-details endpoint and returns the
         * array of class details.
         *
         * @returns {Promise} A promise that resolves to an array of the class details for the identified dataset record.
         */
        self.getClassDetails = function(recordId) {
            // return $http.get(prefix + encodeURIComponent(recordId) + '/instances-details')
            //     .then(response => $q.when(response.data), response => $q.reject(response.statusText));
            return $q.when([{
                label: 'Material',
                count: 13,
                examples: ['Stuff', 'Other Stuff'],
                overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.',
                ontologyId: 'https://matonto.org/uhtc',
                classId: 'https://matonto.org/uhtc#material'
            }, {
                label: 'Crystal Structure',
                count: 4,
                examples: ['FCC', 'Hexagonal'],
                overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.',
                ontologyId: 'https://matonto.org/uhtc',
                classId: 'https://matonto.org/uhtc#crystalStructure'
            }, {
                label: 'Element',
                count: 22,
                examples: ['Carbon', 'Silicon', 'Titanium'],
                overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.',
                ontologyId: 'https://matonto.org/uhtc',
                classId: 'https://matonto.org/uhtc#element'
            }, {
                label: 'Material',
                count: 13,
                examples: ['Stuff', 'Other Stuff'],
                overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.',
                ontologyId: 'https://matonto.org/uhtc',
                classId: 'https://matonto.org/uhtc#material'
            }, {
                label: 'Crystal Structure',
                count: 4,
                examples: ['FCC', 'Hexagonal'],
                overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.',
                ontologyId: 'https://matonto.org/uhtc',
                classId: 'https://matonto.org/uhtc#crystalStructure'
            }, {
                label: 'Element',
                count: 22,
                examples: ['Carbon', 'Silicon', 'Titanium'],
                overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.',
                ontologyId: 'https://matonto.org/uhtc',
                classId: 'https://matonto.org/uhtc#element'
            }, {
                label: 'Material',
                count: 13,
                examples: ['Stuff', 'Other Stuff'],
                overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.',
                ontologyId: 'https://matonto.org/uhtc',
                classId: 'https://matonto.org/uhtc#material'
            }, {
                label: 'Crystal Structure',
                count: 4,
                examples: ['FCC', 'Hexagonal'],
                overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.',
                ontologyId: 'https://matonto.org/uhtc',
                classId: 'https://matonto.org/uhtc#crystalStructure'
            }, {
                label: 'Element',
                count: 22,
                examples: ['Carbon', 'Silicon', 'Titanium'],
                overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.',
                ontologyId: 'https://matonto.org/uhtc',
                classId: 'https://matonto.org/uhtc#element'
            }, {
                label: 'Material',
                count: 13,
                examples: ['Stuff', 'Other Stuff'],
                overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.',
                ontologyId: 'https://matonto.org/uhtc',
                classId: 'https://matonto.org/uhtc#material'
            }, {
                label: 'Crystal Structure',
                count: 4,
                examples: ['FCC', 'Hexagonal'],
                overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.',
                ontologyId: 'https://matonto.org/uhtc',
                classId: 'https://matonto.org/uhtc#crystalStructure'
            }, {
                label: 'Element',
                count: 22,
                examples: ['Carbon', 'Silicon', 'Titanium'],
                overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.',
                ontologyId: 'https://matonto.org/uhtc',
                classId: 'https://matonto.org/uhtc#element'
            }, {
                label: 'Material',
                count: 13,
                examples: ['Stuff', 'Other Stuff'],
                overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.',
                ontologyId: 'https://matonto.org/uhtc',
                classId: 'https://matonto.org/uhtc#material'
            }, {
                label: 'Crystal Structure',
                count: 4,
                examples: ['FCC', 'Hexagonal'],
                overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.',
                ontologyId: 'https://matonto.org/uhtc',
                classId: 'https://matonto.org/uhtc#crystalStructure'
            }, {
                label: 'Element',
                count: 22,
                examples: ['Carbon', 'Silicon', 'Titanium'],
                overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.',
                ontologyId: 'https://matonto.org/uhtc',
                classId: 'https://matonto.org/uhtc#element'
            }, {
                label: 'Material',
                count: 13,
                examples: ['Stuff', 'Other Stuff'],
                overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.',
                ontologyId: 'https://matonto.org/uhtc',
                classId: 'https://matonto.org/uhtc#material'
            }, {
                label: 'Crystal Structure',
                count: 4,
                examples: ['FCC', 'Hexagonal'],
                overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.',
                ontologyId: 'https://matonto.org/uhtc',
                classId: 'https://matonto.org/uhtc#crystalStructure'
            }, {
                label: 'Element',
                count: 22,
                examples: ['Carbon', 'Silicon', 'Titanium'],
                overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.',
                ontologyId: 'https://matonto.org/uhtc',
                classId: 'https://matonto.org/uhtc#element'
            }, {
                label: 'Material',
                count: 13,
                examples: ['Stuff', 'Other Stuff'],
                overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.',
                ontologyId: 'https://matonto.org/uhtc',
                classId: 'https://matonto.org/uhtc#material'
            }, {
                label: 'Crystal Structure',
                count: 4,
                examples: ['FCC', 'Hexagonal'],
                overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.',
                ontologyId: 'https://matonto.org/uhtc',
                classId: 'https://matonto.org/uhtc#crystalStructure'
            }, {
                label: 'Element',
                count: 22,
                examples: ['Carbon', 'Silicon', 'Titanium'],
                overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.',
                ontologyId: 'https://matonto.org/uhtc',
                classId: 'https://matonto.org/uhtc#element'
            }]);
        }
        
        self.getClassInstanceDetails = function(recordId, classId) {
            // var params = $httpParamSerializer({classId});
            // return $http.get(prefix + encodeURIComponent(recordId) + '/instances?' + params)
            //     .then($q.when, response => $q.reject(response.statusText));
            return $q.when({
                data: [{
                        label: 'Silicon Carbide',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Sodium Chloride',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Hydrogen Peroxide',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Silicon Carbide',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Sodium Chloride',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Hydrogen Peroxide',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Silicon Carbide',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Sodium Chloride',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Hydrogen Peroxide',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Silicon Carbide',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Sodium Chloride',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Silicon Carbide',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Sodium Chloride',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Hydrogen Peroxide',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Silicon Carbide',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Sodium Chloride',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Hydrogen Peroxide',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Silicon Carbide',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Sodium Chloride',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Hydrogen Peroxide',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Silicon Carbide',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Sodium Chloride',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Silicon Carbide',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Sodium Chloride',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Hydrogen Peroxide',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Silicon Carbide',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Sodium Chloride',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Hydrogen Peroxide',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Silicon Carbide',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Sodium Chloride',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Hydrogen Peroxide',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Silicon Carbide',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }, {
                        label: 'Sodium Chloride',
                        overview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas mollis purus quis dui varius, sed malesuada est auctor. Vestibulum vitae maximus metus. Curabitur magna nibh, fermentum vitae tincidunt in, luctus ut augue.'
                    }],
                headers: () => {
                    return {
                        'x-total-count': 5000,
                        link: '<http://matonto.org/next>; rel="next"'
                    }
                }
            });
        }
        
        self.createPagedResultsObject = function(response) {
            var object = {};
            _.set(object, 'data', response.data);
            var headers = response.headers();
            _.set(object, 'total', _.get(headers, 'x-total-count', 0));
            var links = util.parseLinks(_.get(headers, 'link', {}));
            _.set(object, 'links.next', _.get(links, 'next', ''));
            _.set(object, 'links.prev', _.get(links, 'prev', ''));
            return object;
        }
    }
})();