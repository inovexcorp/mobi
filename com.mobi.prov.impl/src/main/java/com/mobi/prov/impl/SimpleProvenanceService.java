package com.mobi.prov.impl;

/*-
 * #%L
 * com.mobi.prov.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import com.mobi.ontologies.provo.Activity;
import com.mobi.ontologies.provo.ActivityFactory;
import com.mobi.ontologies.provo.Entity;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.persistence.utils.ReadOnlyRepositoryConnection;
import com.mobi.persistence.utils.Statements;
import com.mobi.prov.api.ProvActivityAction;
import com.mobi.prov.api.ProvOntologyLoader;
import com.mobi.prov.api.ProvenanceService;
import com.mobi.prov.api.builder.ActivityConfig;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.repository.api.OsgiRepository;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class SimpleProvenanceService implements ProvenanceService {

    private static final String ACTIVITY_NAMESPACE = "http://mobi.com/activities/";

    final ValueFactory vf = new ValidatingValueFactory();

    final ModelFactory mf = new DynamicModelFactory();

    @Reference(target = "(id=prov)")
    OsgiRepository repo;

    @Reference
    OrmFactoryRegistry factoryRegistry;

    @Reference
    ActivityFactory activityFactory;

    @Activate
    public void start() {
        ProvOntologyLoader.loadOntology(repo, ProvenanceService.class.getResourceAsStream("/mobi_prov.ttl"));
    }

    @Override
    public RepositoryConnection getConnection() {
        RepositoryConnection conn = repo.getConnection();
        return new ReadOnlyRepositoryConnection(conn);
    }

    @Override
    public Activity createActivity(ActivityConfig config) {
        Map<Class<? extends Activity>, OrmFactory<? extends Activity>> factoryMap = getActivityFactories();
        Activity activity = activityFactory.createNew(vf.createIRI(ACTIVITY_NAMESPACE + UUID.randomUUID()));
        for (Class<? extends Activity> type : config.getTypes()) {
            if (!factoryMap.containsKey(type)) {
                throw new IllegalStateException("No factory registered for type: " + type);
            }
            activity = factoryMap.get(type).createNew(activity.getResource(), activity.getModel());
        }
        activity.setWasAssociatedWith(Collections.singleton(config.getUser()));
        activity.setGenerated(config.getGeneratedEntities());
        addEntitiesToModel(config.getInvalidatedEntities(), activity.getModel());
        activity.setInvalidated(config.getInvalidatedEntities());
        addEntitiesToModel(config.getGeneratedEntities(), activity.getModel());
        activity.setUsed(config.getUsedEntities());
        addEntitiesToModel(config.getUsedEntities(), activity.getModel());
        return activity;
    }

    @Override
    public void addActivity(Activity activity) {
        try (RepositoryConnection conn = repo.getConnection()) {
            if (ConnectionUtils.contains(conn, activity.getResource(), null, null)) {
                throw new IllegalArgumentException("Activity " + activity.getResource() + " already exists");
            }
            conn.add(activity.getModel());
        }
    }

    @Override
    public Optional<Activity> getActivity(Resource activityIRI) {
        try (RepositoryConnection conn = repo.getConnection()) {
            Model activityModel = QueryResults.asModel(conn.getStatements(activityIRI, null, null), mf);
            return activityFactory.getExisting(activityIRI, activityModel).flatMap(activity -> {
                addEntitiesToModel(activity.getGenerated_resource(), activityModel, conn);
                addEntitiesToModel(activity.getInvalidated_resource(), activityModel, conn);
                addEntitiesToModel(activity.getUsed_resource(), activityModel, conn);
                return Optional.of(activity);
            });
        }
    }

    @Override
    public void updateActivity(Activity newActivity) {
        try (RepositoryConnection conn = repo.getConnection()) {
            if (!ConnectionUtils.contains(conn, newActivity.getResource(), null, null)) {
                throw new IllegalArgumentException("Activity " + newActivity.getResource() + " does not exist");
            }
            conn.begin();
            Model activityModel = QueryResults.asModel(conn.getStatements(newActivity.getResource(), null, null),
                    mf);
            conn.remove(activityModel);
            Activity activity = activityFactory.getExisting(newActivity.getResource(), activityModel).orElseThrow(() ->
                    new IllegalStateException("Activity " + newActivity.getResource() + " could not be found"));
            activity.getGenerated_resource().forEach(resource -> conn.remove(resource, null, null));
            activity.getInvalidated_resource().forEach(resource -> conn.remove(resource, null, null));
            activity.getUsed_resource().forEach(resource -> conn.remove(resource, null, null));
            conn.add(newActivity.getModel());
            conn.commit();
        }
    }

    @Override
    public void deleteActivity(Resource activityIRI) {
        try (RepositoryConnection conn = repo.getConnection()) {
            if (!ConnectionUtils.contains(conn, activityIRI, null, null)) {
                throw new IllegalArgumentException("Activity " + activityIRI + " does not exist");
            }
            conn.begin();
            List<Resource> generated = getReferencedEntityIRIs(activityIRI, Activity.generated_IRI, conn);
            final List<Resource> invalided = getReferencedEntityIRIs(activityIRI, Activity.invalidated_IRI, conn);
            final List<Resource> used = getReferencedEntityIRIs(activityIRI, Activity.used_IRI, conn);
            conn.remove(activityIRI, null, null);
            conn.remove((Resource) null, null, activityIRI);
            generated.forEach(resource -> removeIfNotReferenced(resource, conn));
            invalided.forEach(resource -> removeIfNotReferenced(resource, conn));
            used.forEach(resource -> removeIfNotReferenced(resource, conn));
            conn.commit();
        }
    }

    @Override
    public List<ProvActivityAction> getActionWords() {
        String getActionWords = "SELECT ?activity ?action ?pred WHERE "
                + "{ ?activity <http://mobi.com/ontologies/prov#actionWord> ?action ;"
                + " <http://mobi.com/ontologies/prov#provAction> ?pred . }";
        try (RepositoryConnection conn = repo.getConnection()) {
            List<ProvActivityAction> activities = new ArrayList<>();
            TupleQuery query = conn.prepareTupleQuery(getActionWords);
            try (TupleQueryResult result = query.evaluate()) {
                result.forEach(bindingSet -> {
                    String type = Bindings.requiredResource(bindingSet, "activity").stringValue();
                    String word = Bindings.requiredLiteral(bindingSet, "action").stringValue();
                    String pred = Bindings.requiredResource(bindingSet, "pred").stringValue();
                    activities.add(new ProvActivityAction(type, word, pred));
                });
            }
            return activities;
        }
    }

    private void removeIfNotReferenced(Resource iri, RepositoryConnection conn) {
        if (!ConnectionUtils.contains(conn, null, null, iri)) {
            conn.remove(iri, null, null);
        }
    }

    private List<Resource> getReferencedEntityIRIs(Resource activityIRI, String propIRI, RepositoryConnection conn) {
        return QueryResults.asList(conn.getStatements(activityIRI, vf.createIRI(propIRI), null)).stream()
                .map(Statements::objectResource)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toList());
    }

    private Map<Class<? extends Activity>, OrmFactory<? extends Activity>> getActivityFactories() {
        Map<Class<? extends Activity>, OrmFactory<? extends Activity>> factoryMap = new HashMap<>();
        factoryRegistry.getFactoriesOfType(Activity.class).forEach(factory ->
                factoryMap.put(factory.getType(), factory));
        return factoryMap;
    }

    private void addEntitiesToModel(Set<Resource> entityIRIs, Model model, RepositoryConnection conn) {
        entityIRIs.forEach(resource -> {
            Model entityModel = QueryResults.asModel(conn.getStatements(resource, null, null), mf);
            model.addAll(entityModel);
        });
    }

    private void addEntitiesToModel(Set<Entity> entities, Model model) {
        entities.forEach(entity -> model.addAll(entity.getModel()));
    }
}
