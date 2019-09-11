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

themingConfig.$inject = ['$mdThemingProvider'];

function themingConfig($mdThemingProvider) {
    var primary = $mdThemingProvider.definePalette('mobiPrimary', {
        '50': 'E6E8F3',
        '100': 'C1C5E2',
        '200': '989FCF',
        '300': '6E79BC',
        '400': '4F5CAD',
        '500': '303F9F',
        '600': '2B3997',
        '700': '24318D',
        '800': '1E2983',
        '900': '131B72',
        'A100': 'A8AEFF',
        'A200': '757EFF',
        'A400': '424FFF',
        'A700': '2937FF',
        'contrastDefaultColor': 'light',
        'contrastDarkColors': ['50', '100', '200', '300', '400', 'A100'],
        'contrastLightColors': undefined
    });
    var secondary = $mdThemingProvider.definePalette('mobiSecondary', {
        '50': 'E8EAF6',
        '100': 'C5CBE9',
        '200': '9FA8DA',
        '300': '7985CB',
        '400': '5C6BC0',
        '500': '3F51B5',
        '600': '394AAE',
        '700': '3140A5',
        '800': '29379D',
        '900': '1B278D',
        'A100': 'C6CBFF',
        'A200': '939DFF',
        'A400': '606EFF',
        'A700': '4757FF',
        'contrastDefaultColor': 'light',
        'contrastDarkColors': ['50', '100', '200', '300', '400', 'A100'],
        'contrastLightColors': undefined
    });
    $mdThemingProvider.theme('default')
        .primaryPalette('mobiPrimary')
        .accentPalette('mobiSecondary');
}

export default themingConfig;