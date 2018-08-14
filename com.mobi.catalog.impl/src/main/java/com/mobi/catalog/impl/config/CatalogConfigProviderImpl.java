package com.mobi.catalog.impl.config;

/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.ConfigurationPolicy;
import aQute.bnd.annotation.component.Reference;
import aQute.bnd.annotation.metatype.Configurable;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.CatalogFactory;
import com.mobi.catalog.config.CatalogConfig;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.OffsetDateTime;
import java.util.Map;

@Component(
        configurationPolicy = ConfigurationPolicy.require,
        designateFactory = CatalogConfig.class,
        name = CatalogConfigProviderImpl.COMPONENT_NAME
)
public class CatalogConfigProviderImpl implements CatalogConfigProvider {
    static final String COMPONENT_NAME = "com.mobi.catalog.config.CatalogConfigProvider";
    private static final Logger log = LoggerFactory.getLogger(CatalogConfigProviderImpl.class);

    private Repository repository;
    private ValueFactory vf;
    private CatalogFactory catalogFactory;

    private Resource distributedCatalogIRI;
    private Resource localCatalogIRI;

    @Reference(name = "repository")
    void setRepository(Repository repository) {
        this.repository = repository;
    }

    @Reference
    void setValueFactory(ValueFactory valueFactory) {
        vf = valueFactory;
    }

    @Reference
    void setCatalogFactory(CatalogFactory catalogFactory) {
        this.catalogFactory = catalogFactory;
    }

    @Activate
    protected void start(Map<String, Object> props) {
        CatalogConfig config = Configurable.createConfigurable(CatalogConfig.class, props);
        distributedCatalogIRI = vf.createIRI(config.iri() + "-distributed");
        localCatalogIRI = vf.createIRI(config.iri() + "-local");

        try (RepositoryConnection conn = repository.getConnection()) {
            IRI typeIRI = vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI);
            if (!conn.contains(distributedCatalogIRI, typeIRI, vf.createIRI(Catalog.TYPE))) {
                log.debug("Initializing the distributed Mobi Catalog.");
                addCatalogToRepo(distributedCatalogIRI, config.title() + " (Distributed)", config.description(), conn);
            }

            if (!conn.contains(localCatalogIRI, typeIRI, vf.createIRI(Catalog.TYPE))) {
                log.debug("Initializing the local Mobi Catalog.");
                addCatalogToRepo(localCatalogIRI, config.title() + " (Local)", config.description(), conn);
            }
        }
    }

    @Override
    public String getRepositoryId() {
        return repository.getConfig().id();
    }

    @Override
    public Repository getRepository() {
        return repository;
    }

    @Override
    public IRI getDistributedCatalogIRI() {
        return (IRI) distributedCatalogIRI;
    }

    @Override
    public IRI getLocalCatalogIRI() {
        return (IRI) localCatalogIRI;
    }

    /**
     * Adds the model for a Catalog to the repository which contains the provided metadata using the provided Resource
     * as the context.
     *
     * @param catalogId   The Resource identifying the Catalog you wish you create.
     * @param title       The title text.
     * @param description The description text.
     */
    private void addCatalogToRepo(Resource catalogId, String title, String description, RepositoryConnection conn) {
        OffsetDateTime now = OffsetDateTime.now();

        Catalog catalog = catalogFactory.createNew(catalogId);
        catalog.setProperty(vf.createLiteral(title), vf.createIRI(_Thing.title_IRI));
        catalog.setProperty(vf.createLiteral(description), vf.createIRI(_Thing.description_IRI));
        catalog.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.issued_IRI));
        catalog.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.modified_IRI));

        conn.add(catalog.getModel(), catalogId);
    }
}
