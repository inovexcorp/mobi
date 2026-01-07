package com.mobi.catalog.impl.config;

/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.CatalogFactory;
import com.mobi.catalog.config.CatalogConfig;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.repository.api.OsgiRepository;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.metatype.annotations.Designate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.OffsetDateTime;

@Component(
        name = CatalogConfigProviderImpl.COMPONENT_NAME,
        configurationPolicy = ConfigurationPolicy.REQUIRE
)
@Designate(ocd = CatalogConfig.class)
public class CatalogConfigProviderImpl implements CatalogConfigProvider {
    static final String COMPONENT_NAME = "com.mobi.catalog.config.CatalogConfigProvider";
    private static final Logger log = LoggerFactory.getLogger(CatalogConfigProviderImpl.class);

    private Resource distributedCatalogIRI;
    private Resource localCatalogIRI;

    private int limitedSize;

    final ValueFactory vf = new ValidatingValueFactory();

    @Reference(target = "(id=system)")
    OsgiRepository repository;

    @Reference
    CatalogFactory catalogFactory;

    @Activate
    protected void start(final CatalogConfig catalogConfig) {
        distributedCatalogIRI = vf.createIRI(catalogConfig.iri() + "-distributed");
        localCatalogIRI = vf.createIRI(catalogConfig.iri() + "-local");
        this.limitedSize = catalogConfig.limit();
        try (RepositoryConnection conn = repository.getConnection()) {
            IRI typeIRI = vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI);
            if (!ConnectionUtils.contains(conn, distributedCatalogIRI, typeIRI, vf.createIRI(Catalog.TYPE))) {
                log.debug("Initializing the distributed Mobi Catalog.");
                addCatalogToRepo(distributedCatalogIRI, catalogConfig.title() + " (Distributed)", catalogConfig.description(), conn);
            }

            if (!ConnectionUtils.contains(conn, localCatalogIRI, typeIRI, vf.createIRI(Catalog.TYPE))) {
                log.debug("Initializing the local Mobi Catalog.");
                addCatalogToRepo(localCatalogIRI, catalogConfig.title() + " (Local)", catalogConfig.description(), conn);
            }
        }
    }

    @Modified
    protected void modified(final CatalogConfig catalogConfig) {
        this.limitedSize = catalogConfig.limit();
    }

    @Override
    public String getRepositoryId() {
        return repository.getRepositoryID();
    }

    @Override
    public OsgiRepository getRepository() {
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
     * Integer used for limit for limited-results endpoint
     * @return Integer used for limit for limited-results endpoint
     */
    @Override
    public int getLimitedSize() {
        return this.limitedSize;
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
