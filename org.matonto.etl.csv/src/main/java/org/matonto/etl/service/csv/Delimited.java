package org.matonto.etl.service.csv;

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

    String s;

    Delimited(String s){
        this.s = s;
    }

    public String stringValue(){
        return s;
    }

}
