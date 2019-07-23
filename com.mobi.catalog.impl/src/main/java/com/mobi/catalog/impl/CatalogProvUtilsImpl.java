package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
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

import static com.mobi.persistence.utils.RepositoryResults.asModel;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.ontologies.provo.Activity;
import com.mobi.ontologies.provo.Entity;
import com.mobi.ontologies.provo.EntityFactory;
import com.mobi.server.api.Mobi;
import com.mobi.prov.api.ProvenanceService;
import com.mobi.prov.api.builder.ActivityConfig;
import com.mobi.prov.api.ontologies.mobiprov.CreateActivity;
import com.mobi.prov.api.ontologies.mobiprov.CreateActivityFactory;
import com.mobi.prov.api.ontologies.mobiprov.DeleteActivity;
import com.mobi.prov.api.ontologies.mobiprov.DeleteActivityFactory;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.OffsetDateTime;
import java.util.Collections;

@Component
public class CatalogProvUtilsImpl implements CatalogProvUtils {
    private ValueFactory vf;
    private CatalogConfigProvider config;
    private ProvenanceService provenanceService;
    private CreateActivityFactory createActivityFactory;
    private DeleteActivityFactory deleteActivityFactory;
    private EntityFactory entityFactory;
    private ModelFactory modelFactory;
    private Mobi mobi;

    private static final Logger LOG = LoggerFactory.getLogger(CatalogProvUtilsImpl.class);

    private final String atLocation = "http://www.w3.org/ns/prov#atLocation";

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setConfig(CatalogConfigProvider config) {
        this.config = config;
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
    void setMobi(Mobi mobi) {
        this.mobi = mobi;
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
        recordEntity.addProperty(vf.createLiteral(config.getRepositoryId()), vf.createIRI(atLocation));
        createActivity.addGenerated(recordEntity);
        finalizeActivity(createActivity);
        provenanceService.updateActivity(createActivity);
    }

    @Override
    public DeleteActivity startDeleteActivity(User user, Resource recordIri) {
        Entity recordEntity = entityFactory.getExisting(recordIri, asModel(provenanceService.getConnection()
                .getStatements(recordIri, null, null), modelFactory))
                .orElseGet(() -> {
                    LOG.warn("No Entity found for record " + recordIri + ".");
                    Entity entity = entityFactory.createNew(recordIri);
                    entity.addProperty(vf.createLiteral(config.getRepositoryId()), vf.createIRI(atLocation));
                    return entity;
                });

        ActivityConfig config = new ActivityConfig.Builder(Collections.singleton(DeleteActivity.class), user)
                .invalidatedEntity(recordEntity)
                .build();
        Activity activity = initializeActivity(config);

        provenanceService.addActivity(activity);

        return deleteActivityFactory.getExisting(activity.getResource(), activity.getModel()).orElseThrow(() ->
                new IllegalStateException("DeleteActivity not made correctly"));
    }

    @Override
    public void endDeleteActivity(DeleteActivity deleteActivity, Record record) {
        Entity recordEntity = entityFactory.getExisting(record.getResource(), deleteActivity.getModel()).orElseThrow(()
                -> new IllegalStateException("No Entity found for record."));
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
        activity.addProperty(vf.createLiteral(mobi.getServerIdentifier().toString()), vf.createIRI(atLocation));

        return activity;
    }

    private void finalizeActivity(Activity activity) {
        activity.addEndedAtTime(OffsetDateTime.now());
    }
}
