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
import com.mobi.notification.impl.ontologies.EmailNotificationPreference;
import com.mobi.notification.impl.ontologies.EmailNotificationPreferenceFactory;
import com.mobi.notification.impl.ontologies.EmailNotificationPreferenceImpl;
import com.mobi.ontologies.shacl.NodeShapeFactory;
import com.mobi.ontologies.shacl.Shape;
import com.mobi.preference.api.PreferenceService;
import com.mobi.preference.api.ontologies.Preference;
import com.mobi.preference.api.ontologies.Prefix;
import com.mobi.preference.api.ontologies.PrefixFactory;
import com.mobi.preference.api.ontologies.PrefixImpl;
import com.mobi.preference.api.ontologies.PrefixPreference;
import com.mobi.preference.api.ontologies.PrefixPreferenceFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.rest.util.RestUtils;
import org.eclipse.rdf4j.sail.shacl.AST.NodeShape;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.util.Map;
import java.util.UUID;

@Component(immediate=true)
public class SimpleNotificationService {
    private static final String PREFERENCE_GRAPH_IRI = "http://mobi.com/preferencemanagement";
    private static final String PREFERENCE_NAMESPACE = "http://mobi.com/preference#";

    @Reference
    Repository repository;

    @Reference
    ValueFactory vf;

    @Reference
    EmailNotificationPreferenceFactory emailNotificationPreferenceFactory;

    @Reference
    NodeShapeFactory nodeShapeFactory;

    @Reference
    PrefixPreferenceFactory prefixPreferenceFactory;

    @Reference
    PreferenceService preferenceService;

    @Reference
    UserFactory userFactory;

    @Reference
    PrefixFactory prefixFactory;

    @Activate
    protected void start(Map<String, Object> props) {
        EmailNotificationPreference emailNotificationPreference = emailNotificationPreferenceFactory.createNew(vf.createIRI("http://mobi.com"));
        emailNotificationPreference.getProperties(vf.createIRI(Shape.property_IRI));

        emailNotificationPreference.

//        PrefixPreference prefixPreference = prefixPreferenceFactory.createNew(vf.createIRI("http://mobi.com/testPrefixPref"));
//
//        Prefix prefix = prefixFactory.createNew(vf.createIRI(PREFERENCE_NAMESPACE + UUID.randomUUID()));
//        prefix.setHasNamespace("http://www.w3.org/2004/02/skos/core#");
//        prefix.setHasPrefix("skos");
//        prefixPreference.addHasObjectValue(prefix);
//        User adminUser = userFactory.createNew(vf.createIRI("http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997"));
//        prefixPreference.getModel().addAll(prefix.getModel());
//
//        preferenceService.addPreference(adminUser, prefixPreference);



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
