package org.matonto.catalog.impl;

import java.util.HashSet;
import java.util.Set;

import org.matonto.catalog.DataMeta;
import org.matonto.catalog.PrivAgent;

public abstract class Group implements PrivAgent {
    
    private String name;
    private String id;
    private String description;
    private Set<User> members = new HashSet<>();

    @Override
    public String getName() {
        return null;
    }
    
    @Override
    public String getId() {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public Boolean canRead(DataMeta meta) {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public Boolean canWrite(DataMeta meta) {
        // TODO Auto-generated method stub
        return null;
    }
}
