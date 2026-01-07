package com.mobi.setting.impl;

/*-
 * #%L
 * com.mobi.setting.impl
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

import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.setting.api.AbstractSettingService;
import com.mobi.setting.api.SettingService;
import com.mobi.setting.api.ontologies.setting.Preference;
import com.mobi.setting.api.ontologies.setting.PreferenceFactory;
import com.mobi.setting.api.ontologies.setting.PreferenceGroup;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.query.GraphQuery;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Component(
        immediate = true,
        service = { SettingService.class, SimplePreferenceService.class },
        property = {
                "settingType=Preference"
        }
)
public class SimplePreferenceService extends AbstractSettingService<Preference> {
    private static final Logger LOGGER = LoggerFactory.getLogger(SimpleApplicationSettingService.class);
    private static final String USER_BINDING = "user";
    private static final String GET_USER_PREFERENCE;

    static {
        try {
            GET_USER_PREFERENCE = IOUtils.toString(
                    SimplePreferenceService.class.getResourceAsStream("/get-user-preference.rq"),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    public PreferenceFactory preferenceFactory;

    @Activate
    @Override
    protected void start() {
        super.start();
        this.settingFactory = preferenceFactory;
    }

    @Override
    public Class<Preference> getType() {
        return Preference.class;
    }

    @Override
    public String getTypeIRI() {
        return Preference.TYPE;
    }

    @Override
    public String getGroupTypeIRI() {
        return PreferenceGroup.TYPE;
    }

    @Override
    public Set<Preference> getSettings(User... user) {
        if (user.length > 0) {
            LOGGER.debug("Retrieving all Preferences for " + user[0].getResource());
        } else {
            LOGGER.debug("Retrieving all Preferences");

        }
        checkUser(user);
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Set<Resource> userPreferenceIris =
                    conn.getStatements(null, vf.createIRI(Preference.forUser_IRI), user[0].getResource(), context)
                            .stream()
                            .map(Statement::getSubject)
                            .collect(Collectors.toSet());
            return getSettingsFromIris(userPreferenceIris);
        }
    }

    @Override
    public Optional<Preference> getSettingByType(Resource type, User... user) {
        LOGGER.debug("Retrieving Preference for type " + type.stringValue());
        checkUser(user);
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            GraphQuery query = conn.prepareGraphQuery(GET_USER_PREFERENCE);
            query.setBinding(USER_BINDING, user[0].getResource());
            query.setBinding("preferenceType", type);
            return getSettingFromQuery(query);
        }
    }

    @Override
    public <U extends Preference> Optional<U> getSettingByType(Class<U> type, User... user) {
        String typeIRI;
        try {
            Field typeField = type.getField("TYPE");
            typeIRI = (String) typeField.get(null);
        } catch (NoSuchFieldException | IllegalAccessException e) {
            throw new MobiException(e);
        }
        LOGGER.debug("Retrieving Preference by class {} with type IRI {}", type, typeIRI);
        checkUser(user);
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            GraphQuery query = conn.prepareGraphQuery(GET_USER_PREFERENCE);
            query.setBinding(USER_BINDING, user[0].getResource());
            query.setBinding("preferenceType", vf.createIRI(typeIRI));
            return getSettingFromQuery(query, type);
        }
    }

    @Override
    public Resource createSetting(Preference setting, User... user) {
        LOGGER.debug("Creating Preference " + setting.getResource().stringValue());
        checkUser(user);
        validateSetting(setting);
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            checkExistsInRepo(conn, setting, user);
            setting.clearForUser();
            setting.addForUser(user[0]);
            conn.add(setting.getModel(), context);
            return setting.getResource();
        }
    }

    @Override
    public void updateSetting(Resource resourceId, Preference setting, User... user) {
        LOGGER.debug("Updating Preference " + resourceId.stringValue());
        checkUser(user);
        validateSetting(setting);
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            if (!ConnectionUtils.contains(conn, setting.getResource(), vf.createIRI(setting.forUser_IRI), user[0].getResource(),
                    context)) {
                throw new IllegalArgumentException("Preference " + setting.getResource() + " does not belong to user "
                        + user[0].getResource());
            }
            updateSetting(resourceId, setting, conn);
        }
    }
}
