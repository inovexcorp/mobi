package com.mobi.setting.impl;

/*-
 * #%L
 * com.mobi.setting.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import com.mobi.query.api.GraphQuery;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.setting.api.AbstractSettingService;
import com.mobi.setting.api.SettingService;
import com.mobi.setting.api.ontologies.ApplicationSetting;
import com.mobi.setting.api.ontologies.ApplicationSettingFactory;
import com.mobi.setting.api.ontologies.ApplicationSettingGroup;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Component(
        immediate = true,
        service = { SettingService.class, SimpleApplicationSettingService.class }
)
public class SimpleApplicationSettingService extends AbstractSettingService<ApplicationSetting> {
    private static final Logger LOGGER = LoggerFactory.getLogger(SimpleApplicationSettingService.class);
    private static final String GET_APPLICATION_SETTING;

    static {
        try {
            GET_APPLICATION_SETTING = IOUtils.toString(
                    SimpleApplicationSettingService.class.getResourceAsStream("/get-application-setting.rq"),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    ApplicationSettingFactory applicationSettingFactory;

    @Activate
    @Override
    protected void start() {
        super.start();
        this.settingFactory = applicationSettingFactory;
    }

    @Override
    public Class<ApplicationSetting> getType() {
        return ApplicationSetting.class;
    }

    @Override
    public String getTypeIRI() {
        return ApplicationSetting.TYPE;
    }

    @Override
    public String getGroupTypeIRI() {
        return ApplicationSettingGroup.TYPE;
    }

    @Override
    public Set<ApplicationSetting> getSettings(User... user) {
        LOGGER.debug("Retrieving all ApplicationSettings");
        checkUser(user);
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Set<Resource> applicationSettingIris = conn.getStatements(null, vf.createIRI(RDF.TYPE.toString()),
                    vf.createIRI(ApplicationSetting.TYPE), context)
                    .stream()
                    .map(Statement::getSubject)
                    .collect(Collectors.toSet());
            return getSettingsFromIris(applicationSettingIris);
        }
    }

    @Override
    public Resource createSetting(ApplicationSetting setting, User... user) {
        LOGGER.debug("Creating ApplicationSetting for " + setting.getResource().stringValue());
        checkUser(user);
        validateSetting(setting);
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            checkExistsInRepo(conn, setting);
            conn.add(setting.getModel(), context);
            return setting.getResource();
        }
    }

    @Override
    public void updateSetting(Resource resourceId, ApplicationSetting newApplicationSetting, User... user) {
        LOGGER.debug("Updating ApplicationSetting for " + resourceId.stringValue());
        checkUser(user);
        validateSetting(newApplicationSetting);
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            updateSetting(resourceId, newApplicationSetting, conn);
        }
    }

    @Override
    public Optional<ApplicationSetting> getSettingByType(Resource type, User... user) {
        LOGGER.debug("Retrieving ApplicationSetting by type " + type.stringValue());
        checkUser(user);
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            GraphQuery query = conn.prepareGraphQuery(GET_APPLICATION_SETTING);
            query.setBinding("applicationSettingType", type);
            return getSettingFromQuery(query);
        }
    }

    @Override
    protected void checkUser(User... user) {
        if (user.length > 0) {
            LOGGER.info("User provided are not used in service: " + user[0]);
        }
    }
}
