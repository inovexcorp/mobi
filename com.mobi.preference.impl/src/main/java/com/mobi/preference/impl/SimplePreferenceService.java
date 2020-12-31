package com.mobi.preference.impl;

/*-
 * #%L
 * com.mobi.preference.impl
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

import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.QueryResults;
import com.mobi.persistence.utils.RepositoryResults;
import com.mobi.persistence.utils.Statements;
import com.mobi.preference.api.PreferenceService;
import com.mobi.preference.api.ontologies.Preference;
import com.mobi.preference.api.ontologies.PreferenceFactory;
import com.mobi.query.api.GraphQuery;
import com.mobi.rdf.api.*;
import com.mobi.rdf.orm.Thing;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.exception.RepositoryException;
import org.apache.commons.io.IOUtils;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class SimplePreferenceService implements PreferenceService {
    private static final String PREFERENCE_TYPE_BINDING = "preferenceType";
    private static final String USER_BINDING = "user";
    private static final String GET_USER_PREFERENCE;
    private Repository repository;
    private ValueFactory vf;
    private ModelFactory mf;
    private PreferenceFactory preferenceFactory;
    private Resource context;

    @Reference(name = "repository")
    void setRepository(Repository repository) {
        this.repository = repository;
    }

    @Reference
    void setValueFactory(ValueFactory valueFactory) {
        vf = valueFactory;
    }

    @Reference
    void setModelFactory(ModelFactory modelFactory) { mf = modelFactory; }

    @Reference
    void setPreferenceFactory(PreferenceFactory preferenceFactory) {
        this.preferenceFactory = preferenceFactory;
    }

    static {
        try {
            GET_USER_PREFERENCE = IOUtils.toString(
                    SimplePreferenceService.class.getResourceAsStream("/get-user-preference.rq"), StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Activate
    protected void start(Map<String, Object> props) {
        context = vf.createIRI("http://mobi.com/preferencemanagement");
    }

    @Override
    public Set<Preference> getUserPreferences(User user) {
        try (RepositoryConnection conn = repository.getConnection()) {
            Set<Resource> userPreferenceIris = RepositoryResults.asModel(conn.getStatements(null,
                    vf.createIRI(Preference.forUser_IRI), user.getResource(), context), mf).subjects();
            // TODO: I didn't use preferenceFactory.getAllExisting() because the backing model for each of the resulting
            // TODO: preferences was exactly the same for some reason. Not sure why.
            return userPreferenceIris.stream().map(userPreferenceIri -> {
                Model preferenceModel = RepositoryResults.asModel(conn.getStatements(userPreferenceIri, null, null, context), mf);
                Preference preference = preferenceFactory.getExisting(userPreferenceIri, preferenceModel).orElseThrow(() ->
                        new IllegalStateException("Preference " + userPreferenceIri + " could not be found"));
                addEntitiesToModel(preference.getHasObjectValue_resource(), preferenceModel, conn);
                return preference;
            }).collect(Collectors.toSet());
        }
    }

    @Override
    public Optional<Preference> getPreference(User user, Resource preferenceType) {
        try (RepositoryConnection conn = repository.getConnection()) {
            GraphQuery query = conn.prepareGraphQuery(GET_USER_PREFERENCE);
            query.setBinding(USER_BINDING, user.getResource());
            query.setBinding(PREFERENCE_TYPE_BINDING, preferenceType);
            Model userPreferenceModel = QueryResults.asModel(query.evaluate(), mf);
            Set<Preference> preferences =
                    preferenceFactory.getAllExisting(userPreferenceModel).stream().map(preference -> {
                        // Retrieve all entities connected by hasObjectValue
                        addEntitiesToModel(preference.getHasObjectValue_resource(), userPreferenceModel, conn);
                        return preference;
                    }).collect(Collectors.toSet());
            if (preferences.size() == 1) {
                return Optional.of(preferences.iterator().next());
            } else if (preferences.isEmpty()) {
                return Optional.empty();
            } else {
                throw new RepositoryException("More than one preference of type " + preferenceType + " exists" +
                        " for user " + user.getResource());
            }
        }
    }


    /*
    // Add an instance of Preference for a particular user
    void addPreference(User user, Preference preference) {
    Add the associated preference instance to the repo. Also check to see
    if the instance that hasObjectValue points to exists in the repo, if it does
    do not add it to the repo. If it doesn't, add it to the repo.
    }
     */

    // This method might not work. How would the object IRI already exist in the repo? The frontend wouldn't know how
    // to retrieve that object IRI. It would probably create a new one.
    // TODO: Need to check if a preference exists for that type in the repo
    @Override
    public void addPreference(User user, Preference preference) {
        try (RepositoryConnection conn = repository.getConnection()) {
            if (conn.contains(preference.getResource(), null, null, context)) {
                throw new IllegalArgumentException("Preference " + preference.getResource() + " already exists");
            }
            Resource preferenceType = getPreferenceType(preference);
            // TODO: Am I throwing errors of the correct type?
            if (getPreference(user, preferenceType).isPresent()) {
                throw new IllegalArgumentException("Preference of type " + preferenceType + " already exists for user "
                    + user.getResource());
            }
            preference.addForUser(user);
            conn.add(preference.getModel(), context);
            // TODO: This code might need to be adjusted. I think creation of these objects might require more than just this.
            // TODO: I don't think it will know the ids for the attached objects
            preference.getHasObjectValue().forEach(objectValue -> {
                addIfNotExists(objectValue, conn);
            });
        }
    }

    /*
    Query the repo for the list of IRIs connected to the existingPreference IRI.
    Remove all triples in the namedgraph with a subject of those IRIs if they aren't
    referenced elsewhere (look at removeIfNotReferenced() method in the
    SimpleProvenanceService)
    Remove all triples with a subject of the existingPreference IRI
     */
    @Override
    public void deletePreference(Resource preferenceIRI) {
        try (RepositoryConnection conn = repository.getConnection()) {
            if (!conn.contains(preferenceIRI, null, null, context)) {
                throw new IllegalArgumentException("Preference " + preferenceIRI + " does not exist");
            }
            conn.begin();
            List<Resource> hasValue = getReferencedEntityIRIs(preferenceIRI, Preference.hasObjectValue_IRI
                    , conn);
            conn.remove(preferenceIRI, null, null, context);
            conn.remove((Resource) null, null, preferenceIRI, context);
            hasValue.forEach(resource -> removeIfNotReferenced(resource, conn));
            conn.commit();
        }
    }


    // TODO: Need to implement
    @Override
    public void updatePreference(User user, Preference newPreference) {
        // TODO: Should I implement some kind of rollback if the delete or add is not successful?
        deletePreference(newPreference.getResource());
        addPreference(user, newPreference);
    }

    @Override
    public boolean isSimplePreference(Preference preference) {
        return preference.getHasObjectValue().isEmpty();
    }

    private void removeIfNotReferenced(Resource iri, RepositoryConnection conn) {
        if (!conn.contains(null, null, iri)) {
            conn.remove(iri, null, null);
        }
    }

    private void addIfNotExists(Thing thing, RepositoryConnection conn) {
        if (!conn.contains(thing.getResource(), null, null, context)) {
            conn.add(thing.getModel());
        }
    }

    private List<Resource> getReferencedEntityIRIs(Resource preferenceIRI, String propIRI, RepositoryConnection conn) {
        return RepositoryResults.asList(conn.getStatements(preferenceIRI, vf.createIRI(propIRI), null, context)).stream()
                .map(Statements::objectResource)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toList());
    }

    private void addEntitiesToModel(Set<Resource> entityIRIs, Model model, RepositoryConnection conn) {
        entityIRIs.forEach(resource -> {
            Model entityModel = RepositoryResults.asModel(conn.getStatements(resource, null, null, context), mf);
            model.addAll(entityModel);
        });
    }

    private Resource getPreferenceType(Preference preference) {
        Model tempModel = mf.createModel(preference.getModel().filter(preference.getResource(), vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI), null));
        tempModel.remove(preference.getResource(), vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI), vf.createIRI(Preference.TYPE));
        tempModel.remove(preference.getResource(), vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI), vf.createIRI(Thing.TYPE));
        if (tempModel.objects().size() == 1) {
            return vf.createIRI(tempModel.objects().iterator().next().stringValue());
        } else if (tempModel.objects().size() == 0) {
            // TODO: Is this the correct type of exception to throw?
            throw new IllegalArgumentException("Preference type could not be found");
        } else {
            throw new IllegalStateException("Preference should not have more than 3 types");
        }
    }
}
