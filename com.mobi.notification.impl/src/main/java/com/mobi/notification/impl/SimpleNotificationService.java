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

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.Models;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.preference.api.PreferenceService;
import com.mobi.rdf.api.BNode;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.RepositoryConnection;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.io.IOException;
import java.io.InputStream;

@Component(immediate=true)
public class SimpleNotificationService {
    private static final String NOTIFICATION_ONTOLOGY_NAME = "http://mobi.com/ontologies/notification";
    private static final InputStream NOTIFICATION_ONTOLOGY;

    static {
        NOTIFICATION_ONTOLOGY = SimpleNotificationService.class.getResourceAsStream("/notification.ttl");
    }

    @Reference
    CatalogConfigProvider configProvider;

    @Reference
    ValueFactory vf;

    @Reference
    SesameTransformer transformer;

    @Activate
    protected void start() {
        Model ontologyModel;
        try {
            ontologyModel = Models.createModel("ttl", NOTIFICATION_ONTOLOGY, transformer);
        } catch (IOException e) {
            throw new MobiException(e);
        }

        removeSubjectFromModel(ontologyModel, vf.createIRI(NOTIFICATION_ONTOLOGY_NAME));

        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            conn.add(ontologyModel, vf.createIRI(PreferenceService.GRAPH));
        }
    }

    private void removeAttachedBNodes(Model model, Resource subject) {
        model.filter(subject, null, null).forEach(stmt -> {
            if (stmt.getObject() instanceof BNode) {
                model.remove(vf.createBNode(((BNode) stmt.getObject()).getID()), null, null);
            }
        });
    }

    private void removeSubjectFromModel(Model model, Resource subject) {
        removeAttachedBNodes(model, subject);
        model.remove(subject, null, null);
    }
}
