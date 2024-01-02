/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { Injectable } from '@angular/core';
import { map, concat, pullAt, some, forEach, without, unset, has } from 'lodash';

import { DC, DCTERMS, OWL, RDF, RDFS, SKOS, XSD } from '../../prefixes';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { JSONLDValue } from '../models/JSONLDValue.interface';

/**
 * @class shared.PropertyManagerService
 *
 * A service that provides variables for commonly used property IRIs, axioms, and language tags along with utility
 * methods for adding, removing, and editing values on JSON-LD objects.
 */
@Injectable()
export class PropertyManagerService {
    rdfsAnnotations = map(['comment', 'label', 'seeAlso', 'isDefinedBy'], item => RDFS + item);
    dcAnnotations = map(['contributor', 'coverage', 'creator', 'date', 'description', 'format', 'identifier', 'language', 'publisher', 'relation', 'rights', 'source', 'title', 'type'], item => DCTERMS + item);
    dcElementsAnnotations = map(['abstract' , 'accessRights' , 'accrualMethod' , 'accrualPeriodicity' , 'accrualPolicy' , 'alternative' , 'audience' , 'available' , 'bibliographicCitation' , 'conformsTo' , 'contributor' , 'coverage' , 'created' , 'creator' , 'date' , 'dateAccepted' , 'dateCopyrighted' , 'dateSubmitted' , 'description' , 'educationLevel' , 'extent' , 'format' , 'hasFormat' , 'hasPart' , 'hasVersion' , 'identifier' , 'instructionalMethod' , 'isFormatOf' , 'isPartOf' , 'isReferencedBy' , 'isReplacedBy' , 'isRequiredBy' , 'issued' , 'isVersionOf' , 'language' , 'license' , 'mediator' , 'medium' , 'modified' , 'provenance' , 'publisher' , 'references' , 'relation' , 'replaces' , 'requires' , 'rights' , 'rightsHolder' , 'source' , 'spatial' , 'subject' , 'tableOfContents' , 'temporal' , 'title' , 'type' , 'valid'], item => DC + item);
    
    constructor() {}

    /**
     * `defaultAnnotations` holds an array of annotations that are available by default.
     * @type {string[]}
     */
    defaultAnnotations = concat(this.rdfsAnnotations, this.dcAnnotations, this.dcElementsAnnotations);
    /**
     * `owlAnnotations` holds an array of OWL annotations.
     * @type {string[]}
     */
    owlAnnotations = [`${OWL}deprecated`, `${OWL}versionInfo`];
    /**
     * `skosAnnotations` holds an array of SKOS annotations.
     * @type {string[]}
     */
    skosAnnotations = map(['altLabel', 'changeNote', 'definition', 'editorialNote', 'example', 'hiddenLabel', 'historyNote', 'note', 'prefLabel', 'scopeNote'], item => SKOS + item);

    xsdDatatypes = map(['anyURI', 'boolean', 'byte', 'date', 'dateTime', 'decimal', 'double', 'float', 'int', 'integer', 'language', 'long', 'string'], item => XSD + item);
    rdfDatatypes = map(['langString'], item => RDF + item);
    /**
     * `defaultDatatypes` holds an array of datatypes that are available by default.
     * @type {string[]}
     */
    defaultDatatypes = concat(this.xsdDatatypes, this.rdfDatatypes);
    /**
     * `ontologyProperties` holds an array of the property types available to be added to the ontology entity
     * within an ontology.
     * @type {string[]}
     */
    ontologyProperties = map(['priorVersion', 'backwardCompatibleWith', 'incompatibleWith', 'versionIRI'], item => OWL + item);
    /**
     * `conceptSchemeRelationshipList` holds an array of the relationships that skos:Concepts can have with
     * skos:ConceptSchemes.
     * @type {string[]}
     */
    conceptSchemeRelationshipList = map(['topConceptOf', 'inScheme'], item => SKOS + item);
    /**
     * `conceptRelationshipList` holds an array of the relationships that skos:Concepts can have with other
     * skos:Concepts.
     * @type {string[]}
     */
    conceptRelationshipList = map(['broaderTransitive', 'broader', 'broadMatch', 'narrowerTransitive', 'narrower', 'narrowMatch', 'related', 'relatedMatch', 'mappingRelation', 'closeMatch', 'exactMatch'], item => SKOS + item);
    /**
     * `schemeRelationshipList` holds an array of the relationships that skos:ConceptSchemes can have with other
     * entities.
     * @type {string[]}
     */
    schemeRelationshipList = [`${SKOS}hasTopConcept`];
    /**
     * `classAxiomList` holds an array of objects representing supported axioms on owl:Classes with the
     * key name for the list of values from a {@link shared.OntologyStateService#listItem}.
     * @type {{iri: string, valuesKey: string}[]}
     */
    classAxiomList: {iri: string, valuesKey: string}[] = [
        {iri: `${RDFS}subClassOf`, valuesKey: 'classes'},
        {iri: `${OWL}disjointWith`, valuesKey: 'classes'},
        {iri: `${OWL}equivalentClass`, valuesKey: 'classes'}
    ];
    /**
     * `datatypeAxiomList` holds an array of objects representing supported axioms on owl:DatatypeProperties
     * with the key name for the list of values from a {@link shared.OntologyStateService#listItem}.
     * @type {{iri: string, valuesKey: string}[]}
     */
    datatypeAxiomList: {iri: string, valuesKey: string}[] = [
        {iri: `${RDFS}domain`, valuesKey: 'classes'},
        {iri: `${RDFS}range`, valuesKey: 'dataPropertyRange'},
        {iri: `${OWL}equivalentProperty`, valuesKey: 'dataProperties'},
        {iri: `${RDFS}subPropertyOf`, valuesKey: 'dataProperties'},
        {iri: `${OWL}disjointWith`, valuesKey: 'dataProperties'}
    ];
    /**
     * `objectAxiomList` holds an array of objects representing supported axioms on owl:ObjectProperties
     * with the key name for the list of values from a {@link shared.OntologyStateService#listItem}.
     * @type {{iri: string, valuesKey: string}[]}
     */
    objectAxiomList: {iri: string, valuesKey: string}[] = [
        {iri: `${RDFS}domain`, valuesKey: 'classes'},
        {iri: `${RDFS}range`, valuesKey: 'classes'},
        {iri: `${OWL}equivalentProperty`, valuesKey: 'objectProperties'},
        {iri: `${RDFS}subPropertyOf`, valuesKey: 'objectProperties'},
        {iri: `${OWL}inverseOf`, valuesKey: 'objectProperties'},
        {iri: `${OWL}disjointWith`, valuesKey: 'objectProperties'}
    ];
    /**
     * `languageList` holds an array of objects representing supported language tags and their english representations
     * @type {{label: string, value: string}[]}
     */
    languageList: {label: string, value: string}[] = [
        {label: 'Abkhazian', value: 'ab'},
        {label: 'Afar', value: 'aa'},
        {label: 'Afrikaans', value: 'af'},
        {label: 'Akan', value: 'ak'},
        {label: 'Albanian', value: 'sq'},
        {label: 'Amharic', value: 'am'},
        {label: 'Arabic', value: 'ar'},
        {label: 'Aragonese', value: 'an'},
        {label: 'Armenian', value: 'hy'},
        {label: 'Assamese', value: 'as'},
        {label: 'Avaric', value: 'av'},
        {label: 'Avestan', value: 'ae'},
        {label: 'Aymara', value: 'ay'},
        {label: 'Azerbaijani', value: 'az'},
        {label: 'Bambara', value: 'bm'},
        {label: 'Bashkir', value: 'b'},
        {label: 'Basque', value: 'eu'},
        {label: 'Belarusian', value: 'be'},
        {label: 'Bengali (Bangla)', value: 'bn'},
        {label: 'Bihari', value: 'bh'},
        {label: 'Bislama', value: 'bi'},
        {label: 'Bosnian', value: 'bs'},
        {label: 'Breton', value: 'br'},
        {label: 'Bulgarian', value: 'bg'},
        {label: 'Burmese', value: 'my'},
        {label: 'Catalan', value: 'ca'},
        {label: 'Chamorro', value: 'ch'},
        {label: 'Chechen', value: 'ce'},
        {label: 'Chichewa, Chewa, Nyanja', value: 'ny'},
        {label: 'Chinese', value: 'zh'},
        {label: 'Chinese (Simplified)', value: 'zh-hans'},
        {label: 'Chinese (Traditional)', value: 'zh-hant'},
        {label: 'Chuvash', value: 'cv'},
        {label: 'Cornish', value: 'kw'},
        {label: 'Corsican', value: 'co'},
        {label: 'Cree', value: 'cr'},
        {label: 'Croatian', value: 'hr'},
        {label: 'Czech', value: 'cs'},
        {label: 'Danish', value: 'da'},
        {label: 'Divehi, Dhivehi, Maldivian', value: 'dv'},
        {label: 'Dutch', value: 'nl'},
        {label: 'Dzongkha', value: 'dz'},
        {label: 'English', value: 'en'},
        {label: 'Esperanto', value: 'eo'},
        {label: 'Estonian', value: 'et'},
        {label: 'Ewe', value: 'ee'},
        {label: 'Faroese', value: 'fo'},
        {label: 'Fijian', value: 'fj'},
        {label: 'Finnish', value: 'fi'},
        {label: 'French', value: 'fr'},
        {label: 'Fula, Fulah, Pulaar, Pular', value: 'ff'},
        {label: 'Galician', value: 'gl'},
        {label: 'Gaelic (Scottish)', value: 'gd'},
        {label: 'Gaelic (Manx)', value: 'gv'},
        {label: 'Georgian', value: 'ka'},
        {label: 'German', value: 'de'},
        {label: 'Greek', value: 'el'},
        {label: 'Greenlandic', value: 'kl'},
        {label: 'Guarani', value: 'gn'},
        {label: 'Gujarati', value: 'gu'},
        {label: 'Haitian Creole', value: 'ht'},
        {label: 'Hausa', value: 'ha'},
        {label: 'Hebrew', value: 'he'},
        {label: 'Herero', value: 'hz'},
        {label: 'Hindi', value: 'hi'},
        {label: 'Hiri Motu', value: 'ho'},
        {label: 'Hungarian', value: 'hu'},
        {label: 'Icelandic', value: 'is'},
        {label: 'Ido', value: 'io'},
        {label: 'Igbo', value: 'ig'},
        {label: 'Indonesian', value: 'id'},
        {label: 'Interlingua', value: 'ia'},
        {label: 'Interlingue', value: 'ie'},
        {label: 'Inuktitut', value: 'iu'},
        {label: 'Inupiak', value: 'ik'},
        {label: 'Irish', value: 'ga'},
        {label: 'Italian', value: 'it'},
        {label: 'Japanese', value: 'ja'},
        {label: 'Javanese', value: 'jv'},
        {label: 'Kalaallisut, Greenlandic', value: 'kl'},
        {label: 'Kannada', value: 'kn'},
        {label: 'Kanuri', value: 'kr'},
        {label: 'Kashmiri', value: 'ks'},
        {label: 'Kazakh', value: 'kk'},
        {label: 'Khmer', value: 'km'},
        {label: 'Kikuyu', value: 'ki'},
        {label: 'Kinyarwanda (Rwanda)', value: 'rw'},
        {label: 'Kirundi', value: 'rn'},
        {label: 'Kyrgyz', value: 'ky'},
        {label: 'Komi', value: 'kv'},
        {label: 'Kongo', value: 'kg'},
        {label: 'Korean', value: 'ko'},
        {label: 'Kurdish', value: 'ku'},
        {label: 'Kwanyama', value: 'kj'},
        {label: 'Lao', value: 'lo'},
        {label: 'Latin', value: 'la'},
        {label: 'Latvian (Lettish)', value: 'lv'},
        {label: 'Limburgish ( Limburger)', value: 'li'},
        {label: 'Lingala', value: 'ln'},
        {label: 'Lithuanian', value: 'lt'},
        {label: 'Luga-Katanga', value: 'lu'},
        {label: 'Luganda, Ganda', value: 'lg'},
        {label: 'Luxembourgish', value: 'lb'},
        {label: 'Manx', value: 'gv'},
        {label: 'Macedonian', value: 'mk'},
        {label: 'Malagasy', value: 'mg'},
        {label: 'Malay', value: 'ms'},
        {label: 'Malayalam', value: 'ml'},
        {label: 'Maltese', value: 'mt'},
        {label: 'Maori', value: 'mi'},
        {label: 'Marathi', value: 'mr'},
        {label: 'Marshallese', value: 'mh'},
        {label: 'Moldavian', value: 'mo'},
        {label: 'Mongolian', value: 'mn'},
        {label: 'Nauru', value: 'na'},
        {label: 'Navajo', value: 'nv'},
        {label: 'Ndonga', value: 'ng'},
        {label: 'Northern Ndebele', value: 'nd'},
        {label: 'Nepali', value: 'ne'},
        {label: 'Norwegian', value: 'no'},
        {label: 'Norwegian bokmål', value: 'nb'},
        {label: 'Norwegian nynorsk', value: 'nn'},
        {label: 'Nuosu', value: 'ii'},
        {label: 'Occitan', value: 'oc'},
        {label: 'Ojibwe', value: 'oj'},
        {label: 'Old Church Slavonic, Old Bulgarian', value: 'cu'},
        {label: 'Oriya', value: 'or'},
        {label: 'Oromo (Afaan Oromo)', value: 'om'},
        {label: 'Ossetian', value: 'os'},
        {label: 'Pāli', value: 'pi'},
        {label: 'Pashto, Pushto', value: 'ps'},
        {label: 'Persian (Farsi)', value: 'fa'},
        {label: 'Polish', value: 'pl'},
        {label: 'Portuguese', value: 'pt'},
        {label: 'Punjabi (Eastern)', value: 'pa'},
        {label: 'Quechua', value: 'qu'},
        {label: 'Romansh', value: 'rm'},
        {label: 'Romanian', value: 'ro'},
        {label: 'Russian', value: 'ru'},
        {label: 'Sami', value: 'se'},
        {label: 'Samoan', value: 'sm'},
        {label: 'Sango', value: 'sg'},
        {label: 'Sanskrit', value: 'sa'},
        {label: 'Serbian', value: 'sr'},
        {label: 'Serbo-Croatian', value: 'sh'},
        {label: 'Sesotho', value: 'st'},
        {label: 'Setswana', value: 'tn'},
        {label: 'Shona', value: 'sn'},
        {label: 'Sichuan Yi', value: 'ii'},
        {label: 'Sindhi', value: 'sd'},
        {label: 'Sinhalese', value: 'si'},
        {label: 'Siswati', value: 'ss'},
        {label: 'Slovak', value: 'sk'},
        {label: 'Slovenian', value: 'sl'},
        {label: 'Somali', value: 'so'},
        {label: 'Southern Ndebele', value: 'nr'},
        {label: 'Spanish', value: 'es'},
        {label: 'Sundanese', value: 'su'},
        {label: 'Swahili (Kiswahili)', value: 'sw'},
        {label: 'Swati', value: 'ss'},
        {label: 'Swedish', value: 'sv'},
        {label: 'Tagalog', value: 'tl'},
        {label: 'Tahitian', value: 'ty'},
        {label: 'Tajik', value: 'tg'},
        {label: 'Tamil', value: 'ta'},
        {label: 'Tatar', value: 'tt'},
        {label: 'Telugu', value: 'te'},
        {label: 'Thai', value: 'th'},
        {label: 'Tibetan', value: 'bo'},
        {label: 'Tigrinya', value: 'ti'},
        {label: 'Tonga', value: 'to'},
        {label: 'Tsonga', value: 'ts'},
        {label: 'Turkish', value: 'tr'},
        {label: 'Turkmen', value: 'tk'},
        {label: 'Twi', value: 'tw'},
        {label: 'Uyghur', value: 'ug'},
        {label: 'Ukrainian', value: 'uk'},
        {label: 'Urdu', value: 'ur'},
        {label: 'Uzbek', value: 'uz'},
        {label: 'Venda', value: 've'},
        {label: 'Vietnamese', value: 'vi'},
        {label: 'Volapük', value: 'vo'},
        {label: 'Wallon', value: 'wa'},
        {label: 'Welsh', value: 'cy'},
        {label: 'Wolof', value: 'wo'},
        {label: 'Western Frisian', value: 'fy'},
        {label: 'Xhosa', value: 'xh'},
        {label: 'Yiddish', value: 'yi'},
        {label: 'Yoruba', value: 'yo'},
        {label: 'Zhuang, Chuang', value: 'za'},
        {label: 'Zulu', value: 'zu'}
    ];

    /**
     * Removes the the value at the specified index for the specified property on the provided entity.
     *
     * @param {JSONLDObject} entity A JSON-LD entity
     * @param {string} key The property whose value should be removed
     * @param {number} index The index of the value that should be removed
     */
    remove(entity: JSONLDObject, key: string, index: number): void {
        pullAt(entity[key], index);
        if (!entity[key].length) {
            delete entity[key];
        }
    }
    /**
     * Adds the provided value of the provided property to the provided entity with a type and language
     * if provided. Will not add the property value if it already exists.
     *
     * @param {JSONLDObject} entity A JSON-LD entity
     * @param {string} prop The property to add the value for
     * @param {string} value The property value to add
     * @param {string} type The type of the property value
     * @param {string} language The language tag for the property value
     * @return {boolean} Whether or not the value was added
     */
    addValue(entity: JSONLDObject, prop: string, value: string, type: string, language: string): boolean {
        if (!prop) {
            return false;
        }
        const annotation = this.createValueObj(value, type, language);
        if (has(entity, prop)) {
            if (this._contains(entity[prop], annotation)) {
                return false;
            }
            entity[prop].push(annotation);
        } else {
            entity[prop] = [annotation];
        }
        return true;
    }
    /**
     * Adds the provided ID value of the provided property to the provided entity. Will not add the property
     * value if it already exists.
     *
     * @param {JSONLDObject} entity A JSON-LD entity
     * @param {string} prop The property to add the value for
     * @param {string} value The property ID value to add
     * @return {boolean} Whether or not the value was added
     */
    addId(entity: JSONLDObject, prop: string, value: string): boolean {
        if (!prop) {
            return false;
        }
        const axiom = {'@id': value};
        if (has(entity, prop)) {
            if (this._contains(entity[prop], axiom)) {
                return false;
            }
            entity[prop].push(axiom);
        } else {
            entity[prop] = [axiom];
        }
        return true;
    }
    /**
     * Edits the value at the specified index of the specified property on the provided entity to the
     * provided value with a type and language if provided. Will not edit the property value if the new value
     * already exists.
     *
     * @param {JSONLDObject} entity A JSON-LD entity
     * @param {string} prop The property to edit the value of
     * @param {string} value The new property value
     * @param {number} index The index of the value to change
     * @param {string} type The new property value type
     * @param {string} language The new property value language
     * @return {boolean} Whether or not the value was edited
     */
    editValue(entity: JSONLDObject, prop: string, index: number, value: string, type: string, language: string): boolean {
        if (!prop) {
            return false;
        }
        const annotation = entity[prop][index];
        if (!annotation) {
            return false;
        }
        if (this._contains(without(entity[prop], annotation), this.createValueObj(value, type, language))) {
            return false;
        }
        annotation['@value'] = value;
        if (type) {
            annotation['@type'] = type;
        } else {
            unset(annotation, '@type');
        }
        if (language) {
            annotation['@language'] = language;
            unset(annotation, '@type'); // Unset type to create valid JSON-LD when language is set
        } else {
            unset(annotation, '@language');
        }
        return true;
    }
    /**
     * 
     * @param entity 
     * @param prop 
     * @param index 
     * @param value 
     * @returns 
     */
    editId(entity: JSONLDObject, prop: string, index: number, value: string): boolean {
        if (!prop) {
            return false;
        }
        const axiom = entity[prop][index];
        if (!axiom) {
            return false;
        }
        if (this._contains(without(entity[prop], axiom), {'@id': value})) {
            return false;
        }
        axiom['@id'] = value;
        return true;
    }
    /**
     * Creates a value object for JSON-LD with the provided value. Includes a type and language if provided.
     *
     * @param {string} value The value for the JSON-LD object
     * @param {string} type The type for the JSON-LD object
     * @param {string} language The language for the JSON-LD object
     * @return {JSONLDValue} A JSON-LD object representing a property value
     */
    createValueObj(value: string, type: string, language: string): JSONLDValue {
        const annotation = {'@value': value};
        if (type) {
            annotation['@type'] = type;
        }
        if (language) {
            annotation['@language'] = language;
        }
        return annotation;
    }
    /**
     * Creates a map of datatypes to their prefix
     *
     * @return {{[key: string]: string}} A map of datatype to prefix
     */
    getDatatypeMap(): {[key: string]: string} {
        const mapObj = {};
        forEach(this.xsdDatatypes, item => mapObj[item] = XSD);
        forEach(this.rdfDatatypes, item => mapObj[item] = RDF);
        return mapObj;
    }

    private _contains(arr, valueObj): boolean {
        return some(arr, obj => {
            return obj['@id'] === valueObj['@id']
                && obj['@value'] === valueObj['@value']
                && obj['@type'] === valueObj['@type']
                && obj['@language'] === valueObj['@language'];
        });
    }
}
