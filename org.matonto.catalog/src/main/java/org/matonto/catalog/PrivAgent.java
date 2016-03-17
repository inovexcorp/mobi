package org.matonto.catalog;

public interface PrivAgent {
    
    String getName();
    
    String getId();

    Boolean canRead(DataMeta meta);
        
    Boolean canWrite(DataMeta meta);
           
}
