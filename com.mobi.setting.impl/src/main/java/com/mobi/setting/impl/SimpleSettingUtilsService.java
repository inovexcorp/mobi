package com.mobi.setting.impl;

/*-
 * #%L
 * com.mobi.setting.impl
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
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.persistence.utils.Models;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.setting.api.SettingService;
import com.mobi.setting.api.SettingUtilsService;
import com.mobi.setting.api.ontologies.ApplicationSetting;
import org.eclipse.rdf4j.model.BNode;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.model.vocabulary.SHACL;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Component(immediate = true)
public class SimpleSettingUtilsService implements SettingUtilsService {

    final ValueFactory vf = new ValidatingValueFactory();
    final ModelFactory mf = new DynamicModelFactory();

    @Reference
    CatalogConfigProvider configProvider;

    @Reference
    OrmFactoryRegistry factoryRegistry;

    @Reference(target = "(settingType=Application)")
    SettingService<ApplicationSetting> applicationSettingService;

    /** Only supports Simple Settings with no nested property shapes */
    @Override
    public void initializeApplicationSettingsWithDefaultValues(Model model, Resource defaultIRI) {
        Map<Resource, Literal> propertyShapeToDefaultValue = new HashMap<>();
        Map<Resource, Literal> settingToDefaultValue = new HashMap<>();
        model.filter(null, vf.createIRI(SHACL.DEFAULT_VALUE.stringValue()), null).forEach(statement -> {
            propertyShapeToDefaultValue.put(statement.getSubject(), vf.createLiteral(statement.getObject().stringValue()));
        });
        propertyShapeToDefaultValue.keySet().forEach(propertyShape -> {
            model.filter(null, vf.createIRI(SHACL.PROPERTY.stringValue()), propertyShape).forEach(statement -> {
                settingToDefaultValue.put(statement.getSubject(), propertyShapeToDefaultValue.get(propertyShape));
            });
        });

        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            for (Resource settingIRI : settingToDefaultValue.keySet()) {
                Literal defaultValue = settingToDefaultValue.get(settingIRI);
                if (defaultValue.stringValue().isEmpty()) {
                    return;
                }
                if (ConnectionUtils.contains(conn, settingIRI, null, null,
                        vf.createIRI(SettingService.GRAPH))) {
                    Optional<ApplicationSetting> applicationSettingOpt = applicationSettingService
                            .getSettingByType(settingIRI);
                    // if the default application setting value has not been set, set it now using the
                    // sh:defaultValue
                    if (!applicationSettingOpt.isPresent()) {
                        OrmFactory<? extends ApplicationSetting> theFactory = (OrmFactory<? extends ApplicationSetting>)
                                factoryRegistry.getFactoryOfType((IRI) settingIRI)
                                        .orElseThrow(() -> new IllegalArgumentException("Unknown setting type: " + settingIRI));
                        ApplicationSetting theSetting = theFactory.createNew(vf.createIRI(defaultIRI.stringValue()
                                + UUID.randomUUID()));
                        theSetting.setHasDataValue(defaultValue);
                        applicationSettingService.createSetting(theSetting);
                    }
                }
            }
        }
    }

    @Override
    public Model updateRepoWithSettingDefinitions(InputStream ontology, String ontologyName) {
        Model ontologyModel;
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            ontologyModel = Models.createModel("ttl", ontology).getModel();
            removeSubjectFromModel(ontologyModel, vf.createIRI(ontologyName));
            ontologyModel.subjects().forEach(subject -> {
                Model repoStatements = mf.createEmptyModel();
                conn.getStatements(subject, null, null, vf.createIRI(SettingService.GRAPH)).stream()
                        .map(statement -> vf.createStatement(statement.getSubject(), statement.getPredicate(),
                                statement.getObject()))
                        .forEach(repoStatements::add);
                Model modelStatements = ontologyModel.filter(subject, null, null);
                boolean modelsEquivalent = true;
                if (modelStatements.size() != repoStatements.size()) {
                    modelsEquivalent = false;
                }
                if (modelsEquivalent) {
                    for (Statement modelStatement : modelStatements) {
                        if (!repoStatements.contains(modelStatement)) {
                            modelsEquivalent = false;
                        }
                    }
                }
                if (!modelsEquivalent) {
                    conn.begin();
                    conn.remove(subject, null, null, vf.createIRI(SettingService.GRAPH));
                    conn.add(modelStatements, vf.createIRI(SettingService.GRAPH));
                    conn.commit();
                }
            });
        } catch (IOException e) {
            throw new MobiException(e);
        }
        return ontologyModel;
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
