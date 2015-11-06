package org.matonto.etl.service.csv;

import org.openrdf.model.URI;
import org.openrdf.model.ValueFactory;
import org.openrdf.model.impl.ValueFactoryImpl;

public enum Delimited {
    TYPE ("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
    MAPS_TO ("http://matonto.org/ontologies/delimited/mapsTo"),
    COLUMN_INDEX  ("http://matonto.org/ontologies/delimited/columnIndex"),
    HAS_PREFIX ("http://matonto.org/ontologies/delimited/hasPrefix"),
    HAS_PROPERTY ("http://matonto.org/ontologies/delimited/hasProperty"),
    DATA_PROPERTY ("http://matonto.org/ontologies/delimited/dataProperty"),
    OBJECT_PROPERTY ("http://matonto.org/ontologies/delimited/objectProperty"),
    CLASS_MAPPING_PROP ("http://matonto.org/ontologies/delimited/classMapping"),
    LOCAL_NAME ("http://matonto.org/ontologies/delimited/localName"),
    DOCUMENT ("http://matonto.org/ontologies/delimited/Document"),
    SEPARATOR ("http://matonto.org/ontologies/delimited/separator");


    ValueFactory vf = ValueFactoryImpl.getInstance();

    String uri;

    Delimited(String uri){
        this.uri = uri;
    }

    public URI uri(){
        return vf.createURI(uri);
    }

}
