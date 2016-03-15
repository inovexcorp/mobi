package org.matonto.catalog;

import java.util.Date;

public interface DataMeta {

        String getRepositoryId();
        
        String getAuthor();
        
        Date created();
        
        Date lastModified();
        
        DataClasses getClassification();
        
}