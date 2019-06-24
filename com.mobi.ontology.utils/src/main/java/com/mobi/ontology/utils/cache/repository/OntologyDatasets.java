package com.mobi.ontology.utils.cache.repository;

/*-
 * #%L
 * com.mobi.ontology.utils
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

import com.mobi.persistence.utils.ResourceUtils;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;

public class OntologyDatasets {

    public static final String DEFAULT_DS_NAMESPACE = "http://mobi.com/dataset/";
    public static final String SYSTEM_DEFAULT_NG_SUFFIX = "_system_dng";
    public static final String TIMESTAMP_IRI_STRING = "http://mobi.com/ontologies/graph#lastAccessed";
    public static final String UNRESOLVED_IRI_STRING = "http://mobi.com/ontologies/graph#unresolved";
    public static final String CACHE_KEY_SEPARATOR = "&";

    /**
     * Creates an Ontology Dataset IRI given a cache key. Prepends the dataset namespace to the encoded key.
     *
     * @param key The key associated with an Ontology
     * @param vf The ValueFactory used to create an IRI
     * @return A Dataset IRI based on the cache key
     */
    public static IRI createDatasetIRIFromKey(String key, ValueFactory vf) {
        return vf.createIRI(DEFAULT_DS_NAMESPACE + ResourceUtils.encode(key));
    }

    /**
     * Creates a system default named graph IRI for the Ontology Dataset associated with a cache key.
     *
     * @param key The key associated with an Ontology
     * @param vf The ValueFactory used to create an IRI
     * @return A system default named graph IRI based on the cache key
     */
    public static IRI createSystemDefaultNamedGraphIRIFromKey(String key, ValueFactory vf) {
        return vf.createIRI(DEFAULT_DS_NAMESPACE + ResourceUtils.encode(key) + SYSTEM_DEFAULT_NG_SUFFIX);
    }

    /**
     * Creates a system default named graph IRI for the provided Ontology Dataset IRI.
     *
     * @param iri The resource associated with an Ontology Dataset
     * @param vf The ValueFactory used to create an IRI
     * @return A system default named graph IRI based on the Ontology Dataset IRI
     */
    public static IRI createSystemDefaultNamedGraphIRI(Resource iri, ValueFactory vf) {
        return vf.createIRI(iri.stringValue() + SYSTEM_DEFAULT_NG_SUFFIX);
    }

    /**
     * Gets an Ontology Dataset IRI from the provided system default named graph IRI.
     *
     * @param iri The system default named graph IRI
     * @param vf The ValueFactory used to create an IRI
     * @return The Ontology Dataset IRI associated with the provided system default named graph IRI
     */
    public static IRI getDatasetIriFromSystemDefaultNamedGraph(Resource iri, ValueFactory vf) {
        return vf.createIRI(iri.stringValue().substring(0, iri.stringValue()
                .lastIndexOf(OntologyDatasets.SYSTEM_DEFAULT_NG_SUFFIX)));
    }

    /**
     * Creates an Ontology cache key from the recordId and commitId.
     *
     * @param recordId The Resource of the recordId for the Ontology
     * @param commitId The Resource of the commitId
     * @return An ontology cache key
     */
    public static String createRecordKey(Resource recordId, Resource commitId) {
        return recordId.stringValue() + CACHE_KEY_SEPARATOR + commitId.stringValue();
    }
}
