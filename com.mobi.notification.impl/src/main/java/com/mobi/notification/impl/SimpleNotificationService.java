package com.mobi.notification.impl;

/*-
 * #%L
 * com.mobi.notification.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2020 iNovex Information Systems, Inc.
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

import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.ontologies.usermanagement.UserFactory;
import com.mobi.notification.impl.ontologies.EmailNotificationPreferenceFactory;
import com.mobi.preference.api.PreferenceService;
import com.mobi.preference.api.ontologies.Preference;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.rest.util.RestUtils;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.util.Map;

@Component(immediate=true)
public class SimpleNotificationService {
    private static final String PREFERENCE_GRAPH_IRI = "http://mobi.com/preferencemanagement";
    private Repository repository;
    private ValueFactory vf;
    private EmailNotificationPreferenceFactory emailNotificationPreferenceFactory;
    private PreferenceService preferenceService;
    private UserFactory userFactory;

    @Reference(name = "repository")
    void setRepository(Repository repository) {
        this.repository = repository;
    }

    @Reference
    void setValueFactory(ValueFactory valueFactory) {
        vf = valueFactory;
    }

    @Reference
    void setEmailNotificationPreferenceFactory(EmailNotificationPreferenceFactory emailNotificationPreferenceFactory) {
        this.emailNotificationPreferenceFactory = emailNotificationPreferenceFactory;
    }

    @Reference
    void setPreferenceService(PreferenceService preferenceService) { this.preferenceService = preferenceService; }

    @Reference
    void setUserFactory(UserFactory userFactory) { this.userFactory = userFactory; }

    @Activate
    protected void start(Map<String, Object> props) {


//        distributedCatalogIRI = vf.createIRI(config.iri() + "-distributed");
//        localCatalogIRI = vf.createIRI(config.iri() + "-local");

//
//        try (RepositoryConnection conn = repository.getConnection()) {
//            IRI typeIRI = vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI);
//            if (!conn.contains(vf.createIRI(EmailNotificationPreference.TYPE), typeIRI, vf.createIRI(NodeShape.TYPE))) {
//                log.debug("Initializing Email Notification Preference.");
//                EmailNotificationPreference emailNotificationPreference = emailNotificationPreferenceFactory.createNew(vf.createIRI(EmailNotificationPreference.TYPE));
//                emailNotificationPreference.setProperty()
//            }
//                if (!conn.contains(distributedCatalogIRI, typeIRI, vf.createIRI(Catalog.TYPE))) {
//                    log.debug("Initializing the distributed Mobi Catalog.");
//                    addCatalogToRepo(distributedCatalogIRI, config.title() + " (Distributed)", config.description(), conn);
//                }
//
//            if (!conn.contains(localCatalogIRI, typeIRI, vf.createIRI(Catalog.TYPE))) {
//                log.debug("Initializing the local Mobi Catalog.");
//                addCatalogToRepo(localCatalogIRI, config.title() + " (Local)", config.description(), conn);
//            }
//        }
    }

    /**
     * Adds the model for a Catalog to the repository which contains the provided metadata using the provided Resource
     * as the context.
     *
     * @param catalogId   The Resource identifying the Catalog you wish you create.
     * @param title       The title text.
     * @param description The description text.
     */
//    private void addCatalogToRepo(Resource catalogId, String title, String description, RepositoryConnection conn) {
//        OffsetDateTime now = OffsetDateTime.now();
//
//        Catalog catalog = catalogFactory.createNew(catalogId);
//        catalog.setProperty(vf.createLiteral(title), vf.createIRI(_Thing.title_IRI));
//        catalog.setProperty(vf.createLiteral(description), vf.createIRI(_Thing.description_IRI));
//        catalog.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.issued_IRI));
//        catalog.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.modified_IRI));
//
//        conn.add(catalog.getModel(), catalogId);
//    }
}
