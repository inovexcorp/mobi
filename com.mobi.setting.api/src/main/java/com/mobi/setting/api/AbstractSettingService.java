package com.mobi.setting.api;

/*-
 * #%L
 * com.mobi.setting.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.persistence.utils.Statements;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.setting.api.ontologies.setting.Setting;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.GraphQuery;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

public abstract class AbstractSettingService<T extends Setting> implements SettingService<T> {

    private static final Logger LOGGER = LoggerFactory.getLogger(AbstractSettingService.class);

    public final ValueFactory vf = new ValidatingValueFactory();
    public final ModelFactory mf = new DynamicModelFactory();

    @Reference
    public OrmFactoryRegistry factoryRegistry;

    @Reference
    public CatalogConfigProvider configProvider;

    public OrmFactory<T> settingFactory;

    protected Resource context;

    private static final String GET_SETTING_DEFINITIONS;
    private static final String GET_GROUPS;

    static {
        try {
            GET_SETTING_DEFINITIONS = IOUtils.toString(
                    AbstractSettingService.class.getResourceAsStream("/get-setting-definitions.rq"),
                    StandardCharsets.UTF_8
            );
            GET_GROUPS = IOUtils.toString(
                    AbstractSettingService.class.getResourceAsStream("/get-groups.rq"),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Override
    public Optional<T> getSetting(Resource settingId) {
        LOGGER.debug("Retrieving setting " + settingId.stringValue());
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Model settingModel = mf.createEmptyModel();
            conn.getStatements(settingId, null, null, context).stream()
                    .map(statement -> vf.createStatement(statement.getSubject(), statement.getPredicate(),
                            statement.getObject()))
                    .forEach(settingModel::add);
            Optional<T> settingOpt = settingFactory.getExisting(settingId, settingModel);
            settingOpt.ifPresent(setting ->
                    addEntitiesToModel(setting.getHasObjectValue_resource(), settingModel, conn));
            return settingOpt;
        }
    }

    @Override
    public Resource createSetting(Model model, IRI settingType, User... user) {
        LOGGER.debug("Creating setting of type: " + settingType.stringValue());
        Collection<? extends T> settings = getFactoryOfType(settingType).getAllExisting(model);
        if (settings.size() > 1) {
            throw new IllegalStateException("More than one setting of type: " + settingType + " found");
        } else if (settings.isEmpty()) {
            throw new IllegalArgumentException("No setting of type: " + settingType + " was found.");
        } else {
            Setting setting = settings.iterator().next();
            validateNew(setting.getResource(), settingType);
            return createSetting(settings.iterator().next(), user);
        }
    }

    @Override
    public void updateSetting(Resource settingId, Model model, IRI settingType, User... user) {
        LOGGER.debug("Updating setting for " + settingId.stringValue());
        Collection<? extends T> settings = getFactoryOfType(settingType).getAllExisting(model);
        if (settings.size() > 1) {
            throw new IllegalStateException("More than one setting of type: " + settingType + " found");
        } else if (settings.isEmpty()) {
            throw new IllegalArgumentException("No setting of type: " + settingType + " was found.");
        } else {
            updateSetting(settingId, settings.iterator().next(), user);
        }
    }

    @Override
    public void deleteSetting(Resource settingId) {
        LOGGER.debug("Deleting setting " + settingId.stringValue());
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            if (!ConnectionUtils.contains(conn, settingId, null, null, context)) {
                throw new IllegalArgumentException("Setting " + settingId + " does not exist");
            }
            conn.begin();
            List<Resource> hasValue = getReferencedEntityIRIs(settingId, Setting.hasObjectValue_IRI, conn);
            conn.remove(settingId, null, null, context);
            conn.remove((Resource) null, null, settingId, context);
            hasValue.forEach(resource -> removeIfNotReferenced(resource, conn));
            conn.commit();
        }
    }

    @Override
    public void deleteSettingByType(Resource type, User... user) {
        LOGGER.debug("Deleting setting for type" + type.stringValue());
        checkUser(user);
        Optional<T> existingSetting = getSettingByType(type, user);
        if (existingSetting.isPresent()) {
            deleteSetting(existingSetting.get().getResource());
        } else {
            if (user.length > 0) {
                throw new IllegalArgumentException("Setting of type" + type.stringValue() + " does not exist"
                        + " for user");
            } else {
                throw new IllegalArgumentException("Setting of type" + type.stringValue() + " does not exist");
            }
        }
    }

    @Override
    public Resource getSettingType(Setting setting) {
        LOGGER.debug("Retrieving setting type for " + setting.getResource().stringValue());
        List<Resource> types = setting.getModel().filter(setting.getResource(),
                vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI), null)
                .stream()
                .map(Statements::objectResource)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toList());

        List<IRI> orderedIRIs = factoryRegistry.getSortedFactoriesOfType(getType())
                .stream()
                .filter(ormFactory -> {
                    try {
                        return !ormFactory.getTypeIRI().stringValue().equals(getType().getDeclaredField("TYPE")
                                .get(null).toString());
                    } catch (Exception e) {
                        throw new IllegalStateException("Cannot retrieve type from " + getType().getName());
                    }
                })
                .map(OrmFactory::getTypeIRI)
                .filter(types::contains)
                .collect(Collectors.toList());

        if (orderedIRIs.size() == 0) {
            throw new IllegalArgumentException("Setting type could not be found");
        }

        return orderedIRIs.get(0);
    }

    @Override
    public Model getSettingDefinitions(Resource settingGroup) {
        LOGGER.debug("Getting setting definitions for setting group " + settingGroup.stringValue());
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            GraphQuery query = conn.prepareGraphQuery(GET_SETTING_DEFINITIONS);
            query.setBinding("group", settingGroup);
            query.setBinding("settingType", vf.createIRI(getTypeIRI()));
            return QueryResults.asModel(query.evaluate(), mf);
        }
    }

    @Override
    public Model getSettingGroups() {
        LOGGER.debug("Getting setting all setting groups");
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            GraphQuery query = conn.prepareGraphQuery(GET_GROUPS);
            query.setBinding("groupType", vf.createIRI(getGroupTypeIRI()));
            return QueryResults.asModel(query.evaluate(), mf);
        }
    }

    protected void removeIfNotReferenced(Resource iri, RepositoryConnection conn) {
        if (!ConnectionUtils.contains(conn, null, null, iri)) {
            conn.remove(iri, null, null);
        }
    }

    protected List<Resource> getReferencedEntityIRIs(Resource settingIRI, String propIRI, RepositoryConnection conn) {
        return QueryResults.asList(conn.getStatements(settingIRI, vf.createIRI(propIRI), null, vf.createIRI(SettingService.GRAPH)))
                .stream()
                .map(Statements::objectResource)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toList());
    }

    protected void addEntitiesToModel(Set<Resource> entityIRIs, Model model, RepositoryConnection conn) {
        entityIRIs.forEach(resource -> {
            Model entityModel = mf.createEmptyModel();
            conn.getStatements(resource, null, null, vf.createIRI(SettingService.GRAPH)).stream()
                    .map(statement -> vf.createStatement(statement.getSubject(), statement.getPredicate(),
                            statement.getObject()))
                    .forEach(entityModel::add);
            model.addAll(entityModel);
        });
    }

    public void validateSetting(T setting) {
        setting.getHasObjectValue_resource().forEach(objectValue -> {
            if (!setting.getModel().contains(objectValue, null, null)) {
                throw new IllegalArgumentException("Setting RDF must include all referenced object values");
            }
        });

        if (setting.getHasObjectValue_resource().isEmpty() && !setting.getHasDataValue().isPresent()) {
            throw new IllegalArgumentException("Setting must have either data value or object value");
        }
    }

    protected void start() {
        context = vf.createIRI(GRAPH);
    }

    protected void checkUser(User... user) {
        if (user.length == 0) {
            throw new IllegalArgumentException("User must be provided");
        }
        if (user.length > 1) {
            throw new IllegalArgumentException("Only one User may be provided");
        }
    }

    protected Set<T> getSettingsFromIris(Set<Resource> settingIris) {
        return settingIris
                .stream()
                .map(this::getSetting)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toSet());
    }

    protected Optional<T> getSettingFromQuery(GraphQuery query) {
        Model model = QueryResults.asModel(query.evaluate(), mf);
        // Using getAllExisting should be fine in this case because there should be a maximum of 1 Setting
        Collection<T> settings = settingFactory.getAllExisting(model);
        if (settings.size() == 1) {
            return Optional.of(settings.iterator().next());
        } else if (settings.isEmpty()) {
            return Optional.empty();
        } else {
            throw new IllegalStateException("More than one application setting of type " + getTypeIRI() + " exists.");
        }
    }

    protected void checkExistsInRepo(RepositoryConnection conn, T setting, User... user) {
        if (ConnectionUtils.contains(conn, setting.getResource(), null, null, context)) {
            throw new IllegalArgumentException("Setting " + setting.getResource() + " of type " + getTypeIRI()
                    + " already exists");
        }

        Resource settingType = getSettingType(setting);
        if (getSettingByType(settingType, user).isPresent()) {
            if (user.length > 0) {
                throw new IllegalArgumentException("Setting of type " + settingType + " already exists for user "
                        + user[0].getResource());
            } else {
                throw new IllegalArgumentException("Setting of type " + settingType + " already exists.");
            }
        }
    }

    protected void updateSetting(Resource resourceId, T setting, RepositoryConnection conn) {
        checkRepoForSetting(resourceId, conn);

        conn.begin();
        List<Resource> hasValue = getReferencedEntityIRIs(setting.getResource(), Setting.hasObjectValue_IRI, conn);
        conn.remove(setting.getResource(), null, null, context);
        conn.remove((Resource) null, null, setting.getResource(), context);
        hasValue.forEach(resource -> removeIfNotReferenced(resource, conn));
        conn.add(setting.getModel(), context);
        conn.commit();
    }

    private OrmFactory<? extends T> getFactoryOfType(IRI type) {
        return (OrmFactory<? extends T>) factoryRegistry.getFactoryOfType(type)
                .orElseThrow(() -> new IllegalArgumentException("Unknown setting type: " + type));
    }

    private void checkRepoForSetting(Resource resource, RepositoryConnection conn) {
        if (!ConnectionUtils.contains(conn, resource, vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI),
                vf.createIRI(Setting.TYPE), context)) {
            throw new IllegalArgumentException("Setting " + resource + " could not be found");
        }
    }

    private void validateNew(Resource resource, Resource type) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            if (ConnectionUtils.contains(conn, resource, vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI),
                    type, context)) {
                throw new IllegalArgumentException(type.stringValue() + " " + resource + " already exists in repo.");
            }
        }
    }
}
