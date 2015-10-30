package org.matonto.etl.service.csv;


import org.openrdf.model.URI;
import org.openrdf.model.ValueFactory;
import org.openrdf.model.impl.ValueFactoryImpl;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;

public class ClassMapping {

    private Map<Integer, String> dataProperties = new LinkedHashMap<Integer, String>();
    private Map<ClassMapping, String> objectProperties = new LinkedHashMap<ClassMapping, String>();
    private boolean isInstance = false;
    private ValueFactory vf = ValueFactoryImpl.getInstance();
    private String prefix;
    private String mapping;
    private String localName;

    public ClassMapping(){ }


    public String getPrefix(){ return prefix; }

    public boolean isInstance(){ return isInstance; }

    public String getMapping() { return mapping; }

    public Map<ClassMapping, String> getObjectProperties(){return new LinkedHashMap<ClassMapping, String>(objectProperties);}

    public Map<Integer, String> getDataProperties(){  return new LinkedHashMap<Integer, String>(dataProperties);  }

    public String getLocalName(){return localName;}

    public void setInstance(boolean isInstance){ this.isInstance = isInstance; }

    public void addDataProperty(Integer index, String property){ dataProperties.put(index, property); }

    public void addObjectProperty(ClassMapping mapping, String property){objectProperties.put(mapping, property);}

    public void setPrefix(String prefix){this.prefix = prefix;}

    public void setMapping(String mapping){this.mapping = mapping;}

    public void setLocalName(String localName){this.localName = localName;}

}
