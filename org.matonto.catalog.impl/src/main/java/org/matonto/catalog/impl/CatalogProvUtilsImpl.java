package org.matonto.catalog.impl;

/*-
 * #%L
 * org.matonto.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.CatalogProvUtils;
import org.matonto.catalog.api.ontologies.mcat.Record;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.ontologies.dcterms._Thing;
import org.matonto.ontologies.provo.Activity;
import org.matonto.ontologies.provo.Entity;
import org.matonto.ontologies.provo.EntityFactory;
import org.matonto.persistence.utils.RepositoryResults;
import org.matonto.platform.config.api.server.MatOnto;
import org.matonto.prov.api.ProvenanceService;
import org.matonto.prov.api.builder.ActivityConfig;
import org.matonto.prov.api.ontologies.mobiprov.CreateActivity;
import org.matonto.prov.api.ontologies.mobiprov.CreateActivityFactory;
import org.matonto.prov.api.ontologies.mobiprov.DeleteActivity;
import org.matonto.prov.api.ontologies.mobiprov.DeleteActivityFactory;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;

import java.time.OffsetDateTime;
import java.util.Collections;

@Component
public class CatalogProvUtilsImpl implements CatalogProvUtils {
    private ValueFactory vf;
    private CatalogManager catalogManager;
    private ProvenanceService provenanceService;
    private CreateActivityFactory createActivityFactory;
    private DeleteActivityFactory deleteActivityFactory;
    private EntityFactory entityFactory;
    private ModelFactory modelFactory;
    private MatOnto matOnto;

    private final String atLocation = "http://www.w3.org/ns/prov#atLocation";

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    void setProvenanceService(ProvenanceService provenanceService) {
        this.provenanceService = provenanceService;
    }

    @Reference
    void setCreateActivityFactory(CreateActivityFactory createActivityFactory) {
        this.createActivityFactory = createActivityFactory;
    }

    @Reference
    void setDeleteActivityFactory(DeleteActivityFactory deleteActivityFactory) {
        this.deleteActivityFactory = deleteActivityFactory;
    }

    @Reference
    void setEntityFactory(EntityFactory entityFactory) {
        this.entityFactory = entityFactory;
    }

    @Reference
    void setModelFactory(ModelFactory modelFactory) {
        this.modelFactory = modelFactory;
    }

    @Reference
    void setMatOnto(MatOnto matOnto) {
        this.matOnto = matOnto;
    }

    @Override
    public CreateActivity startCreateActivity(User user) {
        ActivityConfig config = new ActivityConfig.Builder(Collections.singleton(CreateActivity.class), user)
                .build();

        Activity activity = initializeActivity(config);

        provenanceService.addActivity(activity);

        return createActivityFactory.getExisting(activity.getResource(), activity.getModel()).orElseThrow(()
                -> new IllegalStateException("CreateActivity not made correctly"));
    }

    @Override
    public void endCreateActivity(CreateActivity createActivity, Resource recordIRI) {
        Entity recordEntity = entityFactory.createNew(recordIRI, createActivity.getModel());
        recordEntity.addGeneratedAtTime(OffsetDateTime.now());
        recordEntity.addProperty(vf.createLiteral(catalogManager.getRepositoryId()), vf.createIRI(atLocation));
        createActivity.addGenerated(recordEntity);
        finalizeActivity(createActivity);
        provenanceService.updateActivity(createActivity);
    }

    @Override
    public DeleteActivity startDeleteActivity(User user, Resource recordIri) {
        Entity recordEntity = entityFactory.getExisting(recordIri, RepositoryResults.asModel(provenanceService.getConnection()
                .getStatements(recordIri, null, null), modelFactory)).orElseThrow(() ->
                        new IllegalStateException("No Entity found for record."));

        ActivityConfig config = new ActivityConfig.Builder(Collections.singleton(DeleteActivity.class), user).invalidatedEntity(recordEntity).build();
        Activity activity = initializeActivity(config);

        provenanceService.addActivity(activity);

        return deleteActivityFactory.getExisting(activity.getResource(), activity.getModel()).orElseThrow(() ->
                new IllegalStateException("DeleteActivity not made correctly"));
    }

    @Override
    public void endDeleteActivity(DeleteActivity deleteActivity, Record record) {
        Entity recordEntity = entityFactory.getExisting(record.getResource(), deleteActivity.getModel()).orElseThrow(()
                -> new IllegalStateException("No Entity found for record."));;
        recordEntity.addInvalidatedAtTime(OffsetDateTime.now());

        finalizeActivity(deleteActivity);

        record.getProperty(vf.createIRI(_Thing.title_IRI))
                .ifPresent(v -> recordEntity.addProperty(v, vf.createIRI(_Thing.title_IRI)));

        provenanceService.updateActivity(deleteActivity);
    }

    @Override
    public void removeActivity(Activity activity) {
        if (activity != null) {
            provenanceService.deleteActivity(activity.getResource());
        }
    }

    private Activity initializeActivity(ActivityConfig config) {
        Activity activity = provenanceService.createActivity(config);
        activity.addStartedAtTime(OffsetDateTime.now());
        activity.addProperty(vf.createLiteral(matOnto.getServerIdentifier().toString()), vf.createIRI(atLocation));

        return activity;
    }

    private void finalizeActivity(Activity activity) {
        activity.addEndedAtTime(OffsetDateTime.now());
    }
}
