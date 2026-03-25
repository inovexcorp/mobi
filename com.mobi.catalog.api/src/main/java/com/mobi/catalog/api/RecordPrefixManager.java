package com.mobi.catalog.api;

/*-
 * #%L
 * com.mobi.catalog.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.SHACL;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import java.util.Map;
import java.util.LinkedHashMap;
import java.util.Collections;

public interface RecordPrefixManager {

    /**
     * Standardized map of the common namespace prefixes that will be applied when
     * serializing the compiled resource of a VersionedRDFRecord to any RDF
     * format other than JSON-LD
     *
     * Keys are prefix labels (e.g. "owl) and values are the full namespace URIs
     */

    Map<String, String> STANDARD_PREFIXES = Collections.unmodifiableMap(new LinkedHashMap<>() {
        {
            put("owl", OWL.NAMESPACE);
            put("rdf", RDF.NAMESPACE);
            put("rdfs", RDFS.NAMESPACE);
            put("dct", DCTERMS.NAMESPACE);
            put("dc", "http://purl.org/dc/elements/1.1/");
            put("skos", SKOS.NAMESPACE);
            put("sh", SHACL.NAMESPACE);
        }});
}
