package org.matonto.catalog.impl;

import org.matonto.catalog.DataMeta;
import org.matonto.catalog.PrivAgent;

public class User implements PrivAgent {

    private String name;
    private String email;
    private String id;
    private String token;
    
    
    public static class Builder {
        private String name;
        private String email;
        private String id;
        private String token;
        
        public Builder name(String name) {
            this.name = name;
            return this;
        }
        
        public Builder email(String email) {
            this.email = email;
            return this;
        }
        
        public Builder id(String id) {
            this.id = id;
            return this;
        }
        
        public Builder token(String token) {
            this.token = token;
            return this;
        }
        
        public User build() {
            return new User(this);
        }
    }
    
    private User(Builder b) { 
        this.name = b.name;
        this.email = b.email;
        this.id = b.id;
        this.token = b.token;
    }
    
    @Override
    public String getName() {
        return name;
    }
    
    public String getEmail() {
        return email;
    }
    
    public String getToken() {
        return token;
    }
    
    @Override
    public String getId() {
        return id;
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
