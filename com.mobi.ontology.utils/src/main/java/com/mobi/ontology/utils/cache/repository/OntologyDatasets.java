package com.mobi.ontology.utils.cache.repository;

import com.mobi.persistence.utils.ResourceUtils;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;

public class OntologyDatasets {

    public static final String DEFAULT_DS_NAMESPACE = "http://mobi.com/dataset/";
    public static final String SYSTEM_DEFAULT_NG_SUFFIX = "_system_dng";
    public static final String TIMESTAMP_IRI_STRING = "http://mobi.com/ontologies/graph#lastAccessed";
    public static final String UNRESOLVED_IRI_STRING = "http://mobi.com/ontologies/graph#unresolved";

    /**
     *
     * @param key
     * @param vf
     * @return
     */
    public static IRI createDatasetIRIFromKey(String key, ValueFactory vf) {
        return vf.createIRI(DEFAULT_DS_NAMESPACE + ResourceUtils.encode(key));
    }

    /**
     *
     * @param key
     * @param vf
     * @return
     */
    public static IRI createSystemDefaultNamedGraphIRIFromKey(String key, ValueFactory vf) {
        return vf.createIRI(DEFAULT_DS_NAMESPACE + ResourceUtils.encode(key) + SYSTEM_DEFAULT_NG_SUFFIX);
    }

    /**
     *
     * @param iri
     * @param vf
     * @return
     */
    public static IRI createSystemDefaultNamedGraphIRI(Resource iri, ValueFactory vf) {
        return vf.createIRI(iri.stringValue() + SYSTEM_DEFAULT_NG_SUFFIX);
    }

    public static IRI getDatasetIriFromSystemDefaultNamedGraph(Resource iri, ValueFactory vf) {
        return vf.createIRI(iri.stringValue().substring(0, iri.stringValue()
                .lastIndexOf(OntologyDatasets.SYSTEM_DEFAULT_NG_SUFFIX)));
    }
}
