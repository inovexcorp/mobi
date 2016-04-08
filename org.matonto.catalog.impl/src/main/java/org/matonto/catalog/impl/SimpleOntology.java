package org.matonto.catalog.impl;

import org.matonto.catalog.api.Distribution;
import org.matonto.catalog.api.Ontology;
import org.matonto.catalog.config.CatalogConfig;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.ConfigurationPolicy;
import aQute.bnd.annotation.component.Reference;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.Set;

@Component(provide = Ontology.class,
           configurationPolicy = ConfigurationPolicy.require,
           designateFactory = CatalogConfig.class
)
public class SimpleOntology implements Ontology {

    private static final String OWL_ONTOLOGY = "http://www.w3.org/2002/07/owl#Ontology";
    private String title;
    private String description = "";
    private OffsetDateTime issued = OffsetDateTime.now();
    private OffsetDateTime modified = null;
    private String identifier = "";
    private Set<String> keywords = Collections.emptySet();
    private Set<Distribution> distributions = Collections.emptySet();
    private Resource type;
    private Resource resource;
    private ValueFactory vf;
    
    @Reference
    protected void setValueFactory(ValueFactory valueFactory) {
        vf = valueFactory;
    }
    
    @Override
    public String getTitle() {
        return title;
    }

    @Override
    public String getDescription() {
        return description;
    }

    @Override
    public OffsetDateTime getIssued() {
        return issued;
    }

    @Override
    public OffsetDateTime getModified() {
        return modified;
    }

    @Override
    public String getIdentifier() {
        return identifier;
    }

    @Override
    public Set<String> getKeywords() {
        return keywords;
    }

    @Override
    public Set<Distribution> getDistributions() {
        return distributions;
    }

    @Override
    public Resource getResource() {
        return resource;
    }

    @Override
    public Resource getType() {
        return type;
    }

    public static class Builder {
        private final String title;

        private String description = "";
        private OffsetDateTime issued = OffsetDateTime.now();
        private OffsetDateTime modified = null;
        private String identifier = "";
        private Set<String> keywords = Collections.emptySet();
        private Set<Distribution> distributions = Collections.emptySet();
        private Resource type;
        private Resource resource;

        /**
         * Builder for SimpleCatalog. Title is required. Issued and Modified Dates default to time
         * of Builder creation. All other parameters are optional and default to empty strings.
         *
         * @param title The Catalog title.
         */
        public Builder(String title) {
            this.title = title;
        }

        public Builder description(String val) {
            this.description = val;
            return this;
        }

        public Builder issued(OffsetDateTime val) {
            this.issued = val;
            return this;
        }

        public Builder modified(OffsetDateTime val) {
            this.modified = val;
            return this;
        }

        public Builder identifier(String val) {
            this.identifier = val;
            return this;
        }

        public Builder addKeyword(Set<String> vals) {
            this.keywords.addAll(vals);
            return this;
        }
        
        public Builder addDistribution(Set<Distribution> distributions) {
            this.distributions.addAll(distributions);
            return this;
        }
        
        public Builder resource(Resource resource) {
            this.resource = resource;
            return this;
        }

        public SimpleOntology build() {
            if (modified == null) {
                modified = issued;
            } else if (issued.isAfter(modified)) {
                throw new IllegalStateException("Modified time must occur after issued time.");
            }

            return new SimpleOntology(this);
        }
    }

    private SimpleOntology(Builder b) {
        this.title = b.title;
        this.description = b.description;
        this.issued = b.issued;
        this.modified = b.modified;
        this.identifier = b.identifier;
        
        if(!b.keywords.isEmpty())
            this.keywords.addAll(b.keywords);
        
        if(!b.distributions.isEmpty())
            this.distributions.addAll(b.distributions);
        
        this.resource = b.resource;
        this.type = vf.createIRI(OWL_ONTOLOGY);      
    }
}
