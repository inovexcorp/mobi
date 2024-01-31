package com.mobi.utils.cli.operations.post;

/*-
 * #%L
 * com.mobi.utils.cli
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

import com.mobi.repository.api.OsgiRepository;
import com.mobi.utils.cli.api.PostRestoreOperation;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.apache.maven.artifact.versioning.VersionRange;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component(
        service = { FixWorkflowOntology.class, PostRestoreOperation.class }
)
public class FixWorkflowOntology implements PostRestoreOperation {
    private static final Logger LOGGER = LoggerFactory.getLogger(FixWorkflowOntology.class);
    private static final ValueFactory vf = new ValidatingValueFactory();

    @Reference(target = "(id=prov)")
    OsgiRepository provRepo;

    @Activate
    public void activate() {
        LOGGER.debug(getClass().getSimpleName() + " activate");
    }

    @Override
    public Integer getPriority() {
        return 112;
    }

    @Override
    public VersionRange getVersionRange() throws InvalidVersionSpecificationException {
        // Versions up to 2.5 (not included)
        return VersionRange.createFromVersionSpec("(,2.5)");
    }

    @Override
    public void execute() {
        try (RepositoryConnection conn = provRepo.getConnection()) {
            conn.clear(vf.createIRI("http://mobi.solutions/ontologies/worklows"));
        }
    }
}
