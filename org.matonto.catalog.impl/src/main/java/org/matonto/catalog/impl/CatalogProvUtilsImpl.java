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
import org.matonto.catalog.api.ontologies.mcat.RecordFactory;
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
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;

import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryManager;
import java.time.OffsetDateTime;
import java.util.Collections;

@Component
public class CatalogProvUtilsImpl implements CatalogProvUtils {
    private ValueFactory vf;
    private RepositoryManager repositoryManager;
    private CatalogManager catalogManager;
    private ProvenanceService provenanceService;
    private CreateActivityFactory createActivityFactory;
    private DeleteActivityFactory deleteActivityFactory;
    private RecordFactory recordFactory;
    private EntityFactory entityFactory;
    private ModelFactory modelFactory;
    private MatOnto matOnto;

    private final String atLocation = "http://www.w3.org/ns/prov#atLocation";

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setRepositoryManager(RepositoryManager repositoryManager) {
        this.repositoryManager = repositoryManager;
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
    void setRecordFactory(RecordFactory recordFactory) {
        this.recordFactory = recordFactory;
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
        OffsetDateTime start = OffsetDateTime.now();
        ActivityConfig config = new ActivityConfig.Builder(Collections.singleton(CreateActivity.class), user)
                .build();
        Activity activity = provenanceService.createActivity(config);
        activity.addProperty(vf.createLiteral(start), vf.createIRI(Activity.startedAtTime_IRI));
        activity.addProperty(vf.createLiteral(matOnto.getServerIdentifier().toString()), vf.createIRI(atLocation));
        provenanceService.addActivity(activity);
        return createActivityFactory.getExisting(activity.getResource(), activity.getModel()).orElseThrow(() ->
                new IllegalStateException("CreateActivity not made correctly"));
    }

    @Override
    public void endCreateActivity(CreateActivity createActivity, Resource recordIRI) {
        OffsetDateTime stop = OffsetDateTime.now();
        Entity recordEntity = entityFactory.createNew(recordIRI, createActivity.getModel());
        recordEntity.addProperty(vf.createLiteral(stop), vf.createIRI(Entity.generatedAtTime_IRI));
        recordEntity.addProperty(vf.createLiteral(catalogManager.getRepositoryId()), vf.createIRI(atLocation));
        createActivity.addProperty(vf.createLiteral(stop), vf.createIRI(Activity.endedAtTime_IRI));
        createActivity.addGenerated(recordEntity);
        provenanceService.updateActivity(createActivity);
    }

    @Override
    public DeleteActivity startDeleteActivity(User user, Resource recordIri) {
        OffsetDateTime start = OffsetDateTime.now();
        ActivityConfig config = new ActivityConfig.Builder(Collections.singleton(DeleteActivity.class), user).build();
        Activity activity = provenanceService.createActivity(config);
        
        // Must add activity before including the entity since the entity already exists.
        provenanceService.addActivity(activity);

        activity.addProperty(vf.createLiteral(start), vf.createIRI(Activity.startedAtTime_IRI));
        activity.addProperty(vf.createLiteral(matOnto.getServerIdentifier().toString()), vf.createIRI(atLocation));

        Entity recordEntity = entityFactory.getExisting(recordIri, RepositoryResults.asModel(provenanceService.getConnection()
                .getStatements(recordIri, null, null), modelFactory)).orElseThrow(() ->
                        new IllegalStateException("No Entity found for record."));

        Repository repo = getRepositoryFromEntity(recordEntity);

        Record record = recordFactory.getExisting(recordIri, RepositoryResults.asModel(repo.getConnection()
                .getStatements(recordIri, null, null), modelFactory)).orElseThrow(() ->
                        new IllegalStateException("Attempting to delete record which does not exist."));

        record.getProperty(vf.createIRI(_Thing.title_IRI)).ifPresent(v -> recordEntity.addProperty(v, vf.createIRI(_Thing.title_IRI)));

        activity.addInvalidated(recordEntity);
        activity.getModel().addAll(recordEntity.getModel());

        provenanceService.updateActivity(activity);

        return deleteActivityFactory.getExisting(activity.getResource(), activity.getModel()).orElseThrow(() ->
                new IllegalStateException("DeleteActivity not made correctly"));
    }

    @Override
    public void endDeleteActivity(DeleteActivity deleteActivity, Resource recordIri) {
        OffsetDateTime stop = OffsetDateTime.now();
        deleteActivity.addProperty(vf.createLiteral(stop), vf.createIRI(Activity.endedAtTime_IRI));
        provenanceService.updateActivity(deleteActivity);
    }

    @Override
    public void removeActivity(Activity activity) {
        if (activity != null) {
            provenanceService.deleteActivity(activity.getResource());
        }
    }

    private Repository getRepositoryFromEntity(Entity entity) {
        Value location = entity.getProperty(vf.createIRI(atLocation)).orElseThrow(() ->
                new IllegalStateException("Missing record location."));

        return repositoryManager.getRepository(location.stringValue()).orElseThrow(() ->
                new IllegalStateException("Catalog repository unavailable"));
    }
}
