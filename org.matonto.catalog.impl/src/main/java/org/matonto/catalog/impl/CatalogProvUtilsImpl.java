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
import org.matonto.catalog.api.CatalogProvUtils;
import org.matonto.catalog.api.ontologies.mcat.Record;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.ontologies.dcterms._Thing;
import org.matonto.ontologies.provo.Activity;
import org.matonto.ontologies.provo.Entity;
import org.matonto.ontologies.provo.EntityFactory;
import org.matonto.platform.config.api.server.MatOnto;
import org.matonto.prov.api.ProvenanceService;
import org.matonto.prov.api.builder.ActivityConfig;
import org.matonto.prov.api.ontologies.mobiprov.CreateActivity;
import org.matonto.prov.api.ontologies.mobiprov.CreateActivityFactory;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;

import java.time.OffsetDateTime;
import java.util.Collections;

@Component
public class CatalogProvUtilsImpl implements CatalogProvUtils {
    private ValueFactory vf;
    private ProvenanceService provenanceService;
    private CreateActivityFactory createActivityFactory;
    private EntityFactory entityFactory;
    private MatOnto matOnto;

    private final String atLocation = "http://www.w3.org/ns/prov#atLocation";

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
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
    void setEntityFactory(EntityFactory entityFactory) {
        this.entityFactory = entityFactory;
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
    public void endCreateActivity(CreateActivity createActivity, Record record) {
        OffsetDateTime stop = OffsetDateTime.now();
        Value title = record.getProperty(vf.createIRI(_Thing.title_IRI)).orElse(record.getResource());
        Entity recordEntity = entityFactory.createNew(record.getResource(), createActivity.getModel());
        recordEntity.addProperty(vf.createLiteral(stop), vf.createIRI(Entity.generatedAtTime_IRI));
        recordEntity.addProperty(title, vf.createIRI(_Thing.title_IRI));
        createActivity.addProperty(vf.createLiteral(stop), vf.createIRI(Activity.endedAtTime_IRI));
        createActivity.addGenerated(recordEntity);
        provenanceService.updateActivity(createActivity);
    }

    @Override
    public void removeActivity(Activity activity) {
        if (activity != null) {
            provenanceService.deleteActivity(activity.getResource());
        }
    }
}
